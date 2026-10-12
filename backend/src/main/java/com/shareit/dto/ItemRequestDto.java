package com.shareit.dto;

import com.shareit.model.ItemStatus;
import jakarta.validation.constraints.*;
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
    @Size(min = 2, max = 150, message = "Title must be between 2 and 150 characters")
    private String title;

    @Size(max = 3000, message = "Description cannot exceed 3000 characters")
    private String description;

    @NotBlank(message = "Category is required")
    @Size(max = 60, message = "Category cannot exceed 60 characters")
    private String category;

    @Size(max = 2000, message = "Image URL cannot exceed 2000 characters")
    private String imageUrl;

    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String location;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @PositiveOrZero(message = "Daily rate must be zero or a positive amount")
    @Max(value = 100000, message = "Daily rate cannot exceed 100,000")
    private Double dailyRate;

    @PositiveOrZero(message = "Security deposit must be zero or a positive amount")
    @Max(value = 500000, message = "Security deposit cannot exceed 500,000")
    private Double securityDeposit;

    private ItemStatus status;
}
