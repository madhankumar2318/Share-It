package com.shareit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTrustDto {
    private Long userId;
    private String fullName;
    private boolean phoneVerified;
    private boolean emailVerified;
    private int completedReturns;
    private int onTimeReturns;
    private double onTimeRate;
    private double averageRating;
    private long totalReviews;
    private int itemsListed;
    private int itemsLentCount;
    private String trustTier;      // "GOLD_BORROWER", "SILVER_BORROWER", "VERIFIED_NEIGHBOR", "NEW_NEIGHBOR"
    private String tierLabel;      // "Gold Borrower", "Silver Borrower", "Verified Neighbor", "New Neighbor"
    private String tierDescription;
    private int trustScore;        // 0 - 100
    private String memberSince;    // "Oct 2026"
}
