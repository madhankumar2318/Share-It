package com.shareit.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stored_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoredFile {

    @Id
    @Column(length = 150)
    private String id; // e.g. uuid.jpg

    private String originalName;

    private String contentType;

    @Lob
    @Column(name = "data", columnDefinition = "BYTEA")
    private byte[] data;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
