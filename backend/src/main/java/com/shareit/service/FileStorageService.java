package com.shareit.service;

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

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private final StoredFileRepository storedFileRepository;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir,
                              StoredFileRepository storedFileRepository) {
        this.storedFileRepository = storedFileRepository;
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

        // Generate collision-proof file name
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
