package com.shareit.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.shareit.model.StoredFile;
import com.shareit.repository.StoredFileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import javax.imageio.ImageIO;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private final StoredFileRepository storedFileRepository;
    private final Cloudinary cloudinary;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir,
                              StoredFileRepository storedFileRepository,
                              Optional<Cloudinary> cloudinaryOptional) {
        this.storedFileRepository = storedFileRepository;
        this.cloudinary = cloudinaryOptional != null ? cloudinaryOptional.orElse(null) : null;
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            // Ignore if directory creation fails on read-only/ephemeral container
        }
    }

    @Transactional
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Only images (jpg, jpeg, png, webp) are permitted. Received: " + extension);
        }

        // ── Magic Bytes Binary Inspection ────────────────────────────────────
        // Reads the actual binary header of the uploaded file to confirm it is
        // a genuine image. This blocks renamed executables, scripts, or ZIP files
        // disguised with a .jpg/.png extension from reaching the database.
        try {
            byte[] fileBytes = file.getBytes();
            try (InputStream magicStream = new ByteArrayInputStream(fileBytes)) {
                if (ImageIO.read(magicStream) == null) {
                    throw new IllegalArgumentException(
                            "File validation failed: The uploaded file is not a valid or readable image. Disguised files are rejected.");
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new IllegalArgumentException("File validation error: Could not read the uploaded file for safety inspection.");
        }
        // ─────────────────────────────────────────────────────────────────────

        // ── Cloudinary Cloud Storage Upload ─────────────────────────────────
        // When Cloudinary credentials are provided, images are uploaded directly
        // to Cloudinary CDN so the Neon PostgreSQL database never exhausts its
        // free storage quota.
        if (this.cloudinary != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> uploadResult = (Map<String, Object>) this.cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "shareit_items",
                                "resource_type", "image"
                        )
                );
                String secureUrl = (String) uploadResult.get("secure_url");
                if (StringUtils.hasText(secureUrl)) {
                    return secureUrl;
                }
            } catch (IOException ex) {
                throw new RuntimeException("Failed to upload image to Cloudinary: " + ex.getMessage(), ex);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        // Fallback: Generate collision-proof file name and store in PostgreSQL
        String fileName = UUID.randomUUID().toString() + "." + extension;

        try {
            // 1. Permanently store into Neon PostgreSQL Database
            StoredFile storedFile = StoredFile.builder()
                    .id(fileName)
                    .originalName(originalFilename)
                    .contentType(file.getContentType())
                    .data(file.getBytes())
                    .build();
            storedFileRepository.save(storedFile);

            // 2. Also keep a local copy if writable
            try {
                Path targetLocation = this.fileStorageLocation.resolve(fileName);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception ignored) {
            }

            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }

    @Transactional(readOnly = true)
    public StoredFile getStoredFile(String fileName) {
        return storedFileRepository.findById(fileName).orElse(null);
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(String fileName) {
        // First check permanent database
        Optional<StoredFile> dbFile = storedFileRepository.findById(fileName);
        if (dbFile.isPresent()) {
            return new ByteArrayResource(dbFile.get().getData()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };
        }

        // Fallback to disk
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Directory traversal attempt detected: " + fileName);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new IllegalArgumentException("File not found: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new IllegalArgumentException("File not found: " + fileName, ex);
        }
    }
}
