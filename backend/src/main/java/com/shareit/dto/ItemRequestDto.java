package com.shareit.dto;

import com.shareit.model.ItemStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String imageUrl;

    private String location;
    private Double latitude;
    private Double longitude;

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

    private ItemStatus status;
}
