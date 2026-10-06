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

    private Double dailyRate;
    private Double securityDeposit;

    // Toy & Book Rotate Club
    private String ageGroup;
    private Boolean isCleanedSanitized;

    // Seasonal Festival & Event Vault
    private String seasonalTag;
    private Boolean seasonalActive;

    // Voice Note Care Instructions (Audio Guide)
    private String voiceNoteUrl;
    private Integer voiceNoteDuration;

    private Double averageRating;
    private Long reviewCount;
    private Boolean isBookedToday;

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
