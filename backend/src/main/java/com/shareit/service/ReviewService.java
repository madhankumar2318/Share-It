package com.shareit.service;

import com.shareit.dto.ReviewRequestDto;
import com.shareit.dto.ReviewResponseDto;
import com.shareit.model.BorrowRequest;
import com.shareit.model.RequestStatus;
import com.shareit.model.Review;
import com.shareit.model.User;
import com.shareit.repository.BorrowRequestRepository;
import com.shareit.repository.ReviewRepository;
import com.shareit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewResponseDto createReview(ReviewRequestDto dto, String userEmail) {
        User reviewer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BorrowRequest request = borrowRequestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new IllegalArgumentException("Borrow request not found with id: " + dto.getRequestId()));

        // Reviews are only permitted once the item has actually been RETURNED
        if (request.getStatus() != RequestStatus.RETURNED) {
            throw new IllegalArgumentException("You can only review an item after the borrowing transaction is completed (RETURNED).");
        }

        // Only the borrower can review the item/experience
        if (!request.getBorrower().getId().equals(reviewer.getId())) {
            throw new AccessDeniedException("Only the borrower of this transaction can write a review.");
        }

        // Prevent duplicate reviews for the same transaction
        if (reviewRepository.findByBorrowRequestIdAndReviewerId(request.getId(), reviewer.getId()).isPresent()) {
            throw new IllegalArgumentException("You have already submitted a review for this borrowing transaction.");
        }

        Review review = Review.builder()
                .borrowRequest(request)
                .item(request.getItem())
                .reviewer(reviewer)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsByItem(Long itemId) {
        return reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getItemRatingStats(Long itemId) {
        Double avg = reviewRepository.getAverageRatingByItemId(itemId);
        Long count = reviewRepository.countReviewsByItemId(itemId);

        return Map.of(
                "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
                "totalReviews", count != null ? count : 0L
        );
    }

    private ReviewResponseDto mapToDto(Review r) {
        return ReviewResponseDto.builder()
                .id(r.getId())
                .requestId(r.getBorrowRequest().getId())
                .itemId(r.getItem().getId())
                .itemTitle(r.getItem().getTitle())
                .reviewerId(r.getReviewer().getId())
                .reviewerName(r.getReviewer().getFullName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
