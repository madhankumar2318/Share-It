package com.shareit.controller;

import com.shareit.dto.ReviewRequestDto;
import com.shareit.dto.ReviewResponseDto;
import com.shareit.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponseDto> createReview(
            @Valid @RequestBody ReviewRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(
                reviewService.createReview(dto, userDetails.getUsername()),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<ReviewResponseDto>> getReviewsByItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(reviewService.getReviewsByItem(itemId));
    }

    @GetMapping("/item/{itemId}/stats")
    public ResponseEntity<Map<String, Object>> getItemRatingStats(@PathVariable Long itemId) {
        return ResponseEntity.ok(reviewService.getItemRatingStats(itemId));
    }
}
