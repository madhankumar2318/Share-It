package com.shareit.dto;

import com.shareit.model.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowResponseDto {
    private Long id;

    // Item details
    private Long itemId;
    private String itemTitle;
    private String itemCategory;
    private String itemImageUrl;

    // Owner details
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;

    // Borrower details
    private Long borrowerId;
    private String borrowerName;
    private String borrowerEmail;
    private String borrowerPhone;

    private LocalDate startDate;
    private LocalDate endDate;
    private String message;
    private RequestStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
