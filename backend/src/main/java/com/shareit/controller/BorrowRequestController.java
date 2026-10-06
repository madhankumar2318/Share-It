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

    @PostMapping("/{id}/verify-pickup")
    public ResponseEntity<BorrowResponseDto> verifyPickup(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String otp = payload.get("otp");
        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException("6-digit Pickup PIN is required");
        }
        String photoUrl = payload.get("photoUrl");
        String conditionNote = payload.get("conditionNote");
        return ResponseEntity.ok(borrowRequestService.verifyPickupOtp(id, otp, photoUrl, conditionNote, userDetails.getUsername()));
    }

    @PostMapping("/{id}/verify-return")
    public ResponseEntity<BorrowResponseDto> verifyReturn(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String otp = payload.get("otp");
        if (otp == null || otp.trim().isEmpty()) {
            throw new IllegalArgumentException("6-digit Return PIN is required");
        }
        String photoUrl = payload.get("photoUrl");
        String conditionNote = payload.get("conditionNote");
        return ResponseEntity.ok(borrowRequestService.verifyReturnOtp(id, otp, photoUrl, conditionNote, userDetails.getUsername()));
    }

    @PostMapping("/{id}/extend")
    public ResponseEntity<BorrowResponseDto> requestExtension(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String newEndDateStr = payload.get("newEndDate");
        if (newEndDateStr == null || newEndDateStr.trim().isEmpty()) {
            throw new IllegalArgumentException("New return date is required");
        }
        java.time.LocalDate newEndDate = java.time.LocalDate.parse(newEndDateStr.trim());
        String reason = payload.get("reason");
        return ResponseEntity.ok(borrowRequestService.requestExtension(id, newEndDate, reason, userDetails.getUsername()));
    }

    @PostMapping("/{id}/extend/respond")
    public ResponseEntity<BorrowResponseDto> respondToExtension(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean approve = Boolean.TRUE.equals(payload.get("approve"));
        return ResponseEntity.ok(borrowRequestService.respondToExtension(id, approve, userDetails.getUsername()));
    }

    @PostMapping("/{id}/send-reminder")
    public ResponseEntity<BorrowResponseDto> sendReturnReminder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(borrowRequestService.sendReturnReminder(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/dropoff")
    public ResponseEntity<BorrowResponseDto> recordDropoff(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String location = payload.get("location");
        String photoUrl = payload.get("photoUrl");
        String note = payload.get("note");
        String passcode = payload.get("passcode");
        return ResponseEntity.ok(borrowRequestService.recordContactlessDropoff(id, location, photoUrl, note, passcode, userDetails.getUsername()));
    }

    @PostMapping("/{id}/confirm-dropoff-pickup")
    public ResponseEntity<BorrowResponseDto> confirmDropoffPickup(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String photoUrl = payload != null ? payload.get("photoUrl") : null;
        String conditionNote = payload != null ? payload.get("conditionNote") : null;
        return ResponseEntity.ok(borrowRequestService.confirmContactlessPickup(id, photoUrl, conditionNote, userDetails.getUsername()));
    }

    @PostMapping("/{id}/return-dropoff")
    public ResponseEntity<BorrowResponseDto> recordReturnDropoff(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String location = payload.get("location");
        String photoUrl = payload.get("photoUrl");
        String note = payload.get("note");
        return ResponseEntity.ok(borrowRequestService.recordContactlessReturn(id, location, photoUrl, note, userDetails.getUsername()));
    }

    @PostMapping("/{id}/confirm-return-dropoff")
    public ResponseEntity<BorrowResponseDto> confirmReturnDropoff(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String photoUrl = payload != null ? payload.get("photoUrl") : null;
        String conditionNote = payload != null ? payload.get("conditionNote") : null;
        return ResponseEntity.ok(borrowRequestService.confirmContactlessReturn(id, photoUrl, conditionNote, userDetails.getUsername()));
    }

    @PostMapping("/{id}/settle-refund")
    public ResponseEntity<BorrowResponseDto> settleRefund(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        Double customRefund = null;
        if (payload != null && payload.get("customRefund") != null) {
            try {
                customRefund = Double.valueOf(String.valueOf(payload.get("customRefund")));
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(borrowRequestService.settleRefund(id, customRefund, userDetails.getUsername()));
    }
}
