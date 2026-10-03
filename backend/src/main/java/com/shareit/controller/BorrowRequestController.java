package com.shareit.controller;

import com.shareit.dto.BorrowRequestDto;
import com.shareit.dto.BorrowResponseDto;
import com.shareit.model.RequestStatus;
import com.shareit.service.BorrowRequestService;
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
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BorrowRequestController {

    private final BorrowRequestService borrowRequestService;

    @PostMapping
    public ResponseEntity<BorrowResponseDto> createRequest(
            @Valid @RequestBody BorrowRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(borrowRequestService.createRequest(dto, userDetails.getUsername()), HttpStatus.CREATED);
    }

    @GetMapping("/borrowed")
    public ResponseEntity<List<BorrowResponseDto>> getMyBorrowRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(borrowRequestService.getMyBorrowRequests(userDetails.getUsername()));
    }

    @GetMapping("/received")
    public ResponseEntity<List<BorrowResponseDto>> getRequestsReceived(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(borrowRequestService.getRequestsReceived(userDetails.getUsername()));
    }

    @GetMapping("/item/{itemId}/booked-ranges")
    public ResponseEntity<List<Map<String, String>>> getBookedRanges(@PathVariable Long itemId) {
        return ResponseEntity.ok(borrowRequestService.getBookedDateRanges(itemId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BorrowResponseDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String statusStr = payload.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Field 'status' is required");
        }
        RequestStatus newStatus = RequestStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(borrowRequestService.updateRequestStatus(id, newStatus, userDetails.getUsername()));
    }
}
