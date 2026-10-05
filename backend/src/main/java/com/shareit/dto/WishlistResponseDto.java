package com.shareit.dto;

import com.shareit.model.WishlistStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponseDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String urgency;
    private String location;
    private WishlistStatus status;

    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;

    private int offersCount;
    private List<WishlistOfferDto> offers;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
