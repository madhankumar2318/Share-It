package com.shareit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistOfferDto {
    private Long id;
    private Long wishlistId;
    private Long lenderId;
    private String lenderName;
    private String lenderPhone;
    private String message;
    private LocalDateTime createdAt;
}
