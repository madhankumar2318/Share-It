package com.shareit.service;

import com.shareit.dto.UserTrustDto;
import com.shareit.model.BorrowRequest;
import com.shareit.model.User;
import com.shareit.repository.BorrowRequestRepository;
import com.shareit.repository.ItemRepository;
import com.shareit.repository.ReviewRepository;
import com.shareit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserTrustService {

    private final UserRepository userRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final ReviewRepository reviewRepository;
    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public UserTrustDto getTrustScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // Completed returns as borrower
        List<BorrowRequest> completedReturns = borrowRequestRepository.findCompletedReturnsByBorrowerId(userId);
        int returnCount = completedReturns.size();

        int onTimeCount = 0;
        for (BorrowRequest req : completedReturns) {
            if (req.getReturnedAt() != null) {
                if (!req.getReturnedAt().toLocalDate().isAfter(req.getEndDate())) {
                    onTimeCount++;
                }
            } else {
                onTimeCount++;
            }
        }

        double onTimeRate = returnCount > 0
                ? Math.round(((double) onTimeCount / returnCount) * 1000.0) / 10.0
                : 100.0;

        // Completed lends as owner
        List<BorrowRequest> completedLends = borrowRequestRepository.findCompletedLendsByOwnerId(userId);
        int itemsLentCount = completedLends.size();

        int itemsListed = itemRepository.findByOwnerId(userId).size();

        Double rawAvgRating = reviewRepository.getAverageRatingByOwnerId(userId);
        double avgRating = rawAvgRating != null ? Math.round(rawAvgRating * 10.0) / 10.0 : 0.0;

        Long rawTotalReviews = reviewRepository.countReviewsByOwnerId(userId);
        long totalReviews = rawTotalReviews != null ? rawTotalReviews : 0L;

        boolean phoneVerified = user.getPhone() != null && !user.getPhone().trim().isEmpty();
        boolean emailVerified = user.getEmail() != null && !user.getEmail().trim().isEmpty();

        // Calculate 0-100 Trust Score
        int score = 30; // Base score for registered user
        if (phoneVerified) {
            score += 25;
        }
        score += Math.min(25, returnCount * 10);
        if (returnCount >= 1 && onTimeRate >= 95.0) {
            score += 5;
        }
        if (itemsLentCount >= 1) {
            score += 5;
        }
        if (totalReviews > 0 && avgRating >= 4.0) {
            score += 10;
        }
        score = Math.min(100, Math.max(30, score));

        // Determine Trust Tier Badges
        String tier;
        String tierLabel;
        String tierDescription;

        if (returnCount >= 3 && onTimeRate >= 90.0 && phoneVerified) {
            tier = "GOLD_BORROWER";
            tierLabel = "🛡️ Gold Borrower";
            tierDescription = "Proven track record with 3+ safe on-time returns";
        } else if (returnCount >= 1 && onTimeRate >= 90.0 && phoneVerified) {
            tier = "SILVER_BORROWER";
            tierLabel = "✨ Silver Borrower";
            tierDescription = "Reliable neighbor with verified return history";
        } else if (phoneVerified) {
            tier = "VERIFIED_NEIGHBOR";
            tierLabel = "🟢 Verified Neighbor";
            tierDescription = "Mobile verified and active community profile";
        } else {
            tier = "NEW_NEIGHBOR";
            tierLabel = "🌱 New Neighbor";
            tierDescription = "Recently joined the community";
        }

        String memberSince = "Member";
        if (user.getCreatedAt() != null) {
            memberSince = "Member since " + user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy"));
        }

        return UserTrustDto.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .phoneVerified(phoneVerified)
                .emailVerified(emailVerified)
                .completedReturns(returnCount)
                .onTimeReturns(onTimeCount)
                .onTimeRate(onTimeRate)
                .averageRating(avgRating)
                .totalReviews(totalReviews)
                .itemsListed(itemsListed)
                .itemsLentCount(itemsLentCount)
                .trustTier(tier)
                .tierLabel(tierLabel)
                .tierDescription(tierDescription)
                .trustScore(score)
                .memberSince(memberSince)
                .build();
    }
}
