package com.shareit.dto;

import com.shareit.model.ItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemResponseDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String imageUrl;
    private String location;
    private Double latitude;
    private Double longitude;
    private ItemStatus status;

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
