package com.shareit.controller;

import com.shareit.service.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String result = fileStorageService.storeFile(file);

        String fileDownloadUri;
        String fileName;
        if (result != null && (result.startsWith("http://") || result.startsWith("https://"))) {
            fileDownloadUri = result;
            fileName = result.substring(result.lastIndexOf('/') + 1);
        } else {
            fileName = result != null ? result : "";
            fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/")
                    .path(fileName)
                    .toUriString();
        }

        return new ResponseEntity<>(
                Map.of(
                        "fileName", fileName,
                        "fileUrl", fileDownloadUri,
                        "url", fileDownloadUri
                ),
                HttpStatus.CREATED
        );
    }

    private static final Map<String, String> SAFE_IMAGE_MIME_TYPES = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp"
    );

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName, HttpServletRequest request) {
        String safeContentType = resolveSafeContentType(fileName);

        com.shareit.model.StoredFile storedFile = fileStorageService.getStoredFile(fileName);
        if (storedFile != null) {
            String dbContentType = storedFile.getContentType();
            String finalContentType = isAllowedImageContentType(dbContentType) ? dbContentType : safeContentType;

            org.springframework.core.io.ByteArrayResource resource =
                    new org.springframework.core.io.ByteArrayResource(storedFile.getData()) {
                        @Override
                        public String getFilename() {
                            return storedFile.getId();
                        }
                    };
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(finalContentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + storedFile.getId() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header("X-Content-Type-Options", "nosniff")
                    .body(resource);
        }

        Resource resource = fileStorageService.loadFileAsResource(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(safeContentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("X-Content-Type-Options", "nosniff")
                .body(resource);
    }

    private boolean isAllowedImageContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return false;
        }
        String clean = contentType.toLowerCase().trim();
        return clean.equals("image/jpeg") || clean.equals("image/png") || clean.equals("image/webp");
    }

    private String resolveSafeContentType(String fileName) {
        if (fileName != null && fileName.contains(".")) {
            String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase().trim();
            if (SAFE_IMAGE_MIME_TYPES.containsKey(extension)) {
                return SAFE_IMAGE_MIME_TYPES.get(extension);
            }
        }
        return "image/jpeg";
    }
}
