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
public class WishlistOfferMessageDto {
    private Long id;
    private Long offerId;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime createdAt;
}
