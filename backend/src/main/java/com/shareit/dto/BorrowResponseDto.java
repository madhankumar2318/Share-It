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
    private UserTrustDto borrowerTrust;

    private LocalDate startDate;
    private LocalDate endDate;
    private String message;
    private RequestStatus status;

    private String pickupOtp;
    private String returnOtp;
    private LocalDateTime handoverAt;
    private LocalDateTime returnedAt;
    private LocalDateTime pickupLockoutUntil;
    private LocalDateTime returnLockoutUntil;

    private String pickupPhotoUrl;
    private String pickupConditionNote;
    private String returnPhotoUrl;
    private String returnConditionNote;

    // Contactless Handover / Drop-off Fields
    private Boolean isContactless;
    private String dropoffLocation;
    private String dropoffPhotoUrl;
    private String dropoffNote;
    private LocalDateTime dropoffAt;
    private String dropoffPasscode;
    private String dropoffStatus;

    // Contactless Return Fields
    private String returnDropoffLocation;
    private String returnDropoffPhotoUrl;
    private String returnDropoffNote;
    private LocalDateTime returnDropoffAt;
    private String returnDropoffStatus;

    private LocalDate extensionProposedEndDate;
    private String extensionStatus;
    private String extensionReason;
    private LocalDateTime lastReminderSentAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
