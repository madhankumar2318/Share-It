package com.shareit.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.shareit.model.StoredFile;
import com.shareit.repository.StoredFileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
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
        // Reads the leading magic bytes of the uploaded file to verify it is
        // a genuine JPEG, PNG, or WEBP image without relying on Java ImageIO
        // (which fails on webp or standard mobile camera profiles).
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
            if (!isValidImageHeader(fileBytes)) {
                throw new IllegalArgumentException(
                        "File validation failed: The uploaded file is not a valid or readable image. Disguised files are rejected.");
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("File validation error: Could not read the uploaded file for safety inspection.");
        }
        // ─────────────────────────────────────────────────────────────────────

        // ── Cloudinary Cloud Storage Upload (with Strict Timeout & Graceful DB Fallback) ──
        // When Cloudinary credentials are provided, attempts upload to Cloudinary CDN.
        // Protected by a strict 6-second timeout: if Cloudinary hangs, is rate-limited,
        // or credentials fail, we immediately fall back to Neon PostgreSQL database storage
        // so the user's item listing is NEVER blocked or hung.
        if (this.cloudinary != null) {
            try {
                java.util.concurrent.CompletableFuture<String> cloudUploadFuture =
                        java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                            try {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> uploadResult = (Map<String, Object>) this.cloudinary.uploader().upload(
                                        fileBytes,
                                        ObjectUtils.asMap(
                                                "folder", "shareit_items",
                                                "resource_type", "image"
                                        )
                                );
                                String secureUrl = (String) uploadResult.get("secure_url");
                                return StringUtils.hasText(secureUrl) ? secureUrl : null;
                            } catch (Exception ex) {
                                log.warn("⚠️ Cloudinary upload call failed: {}", ex.getMessage());
                                return null;
                            }
                        });

                String secureUrl = cloudUploadFuture.get(6, java.util.concurrent.TimeUnit.SECONDS);
                if (StringUtils.hasText(secureUrl)) {
                    log.info("☁️ Image uploaded to Cloudinary CDN successfully: {}", secureUrl);
                    return secureUrl;
                }
            } catch (java.util.concurrent.TimeoutException te) {
                log.warn("⏱️ Cloudinary upload timed out after 6 seconds. Seamlessly falling back to Neon PostgreSQL storage.");
            } catch (Exception ex) {
                log.warn("⚠️ Cloudinary upload encountered error ({}). Seamlessly falling back to Neon PostgreSQL storage.", ex.getMessage());
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
                    .data(fileBytes)
                    .build();
            storedFileRepository.save(storedFile);

            // 2. Also keep a local copy if writable
            try {
                Path targetLocation = this.fileStorageLocation.resolve(fileName);
                Files.copy(new ByteArrayInputStream(fileBytes), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception ignored) {
            }

            log.info("💾 Image saved directly to Neon database storage with filename: {}", fileName);
            return fileName;
        } catch (Exception ex) {
            log.error("❌ Failed to store file: {}", ex.getMessage(), ex);
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
    private boolean isValidImageHeader(byte[] data) {
        if (data == null || data.length < 12) {
            return false;
        }
        // 1. JPEG: starts with SOI marker FF D8
        if ((data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8) {
            return true;
        }
        // 2. PNG: starts with 89 50 4E 47 0D 0A 1A 0A
        if ((data[0] & 0xFF) == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) {
            return true;
        }
        // 3. WEBP: starts with "RIFF" and has "WEBP" at offset 8
        if (data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F' &&
            data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return true;
        }
        // Fallback: check ImageIO
        try {
            return javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(data)) != null;
        } catch (Exception e) {
            return false;
        }
    }
}
