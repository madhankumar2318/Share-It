package com.shareit.service;

import com.shareit.dto.BorrowRequestDto;
import com.shareit.dto.BorrowResponseDto;
import com.shareit.dto.UserTrustDto;
import com.shareit.model.BorrowRequest;
import com.shareit.model.Item;
import com.shareit.model.ItemStatus;
import com.shareit.model.RequestStatus;
import com.shareit.model.User;
import com.shareit.repository.BorrowRequestRepository;
import com.shareit.repository.ItemRepository;
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
public class BorrowRequestService {

    private final BorrowRequestRepository borrowRequestRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserTrustService userTrustService;
    private final AuditLogService auditLogService;

    @Transactional
    public BorrowResponseDto createRequest(BorrowRequestDto dto, String borrowerEmail) {
        if (dto.getStartDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Borrower not found"));

        Item item = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + dto.getItemId()));

        // Prevent owners from requesting their own items
        if (item.getOwner().getId().equals(borrower.getId())) {
            throw new IllegalArgumentException("You cannot borrow your own item!");
        }

        if (item.getStatus() == ItemStatus.UNAVAILABLE) {
            throw new IllegalArgumentException("Item is currently marked as unavailable");
        }

        // Check if item is already accepted/booked for any overlapping dates
        List<BorrowRequest> conflicts = borrowRequestRepository.findConflictingAcceptedRequests(
                item.getId(), null, dto.getStartDate(), dto.getEndDate()
        );
        if (!conflicts.isEmpty()) {
            BorrowRequest firstConflict = conflicts.get(0);
            throw new IllegalArgumentException(String.format(
                    "Item is already reserved from %s to %s. Please pick different dates.",
                    firstConflict.getStartDate(), firstConflict.getEndDate()
            ));
        }

        BorrowRequest request = BorrowRequest.builder()
                .item(item)
                .borrower(borrower)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .message(dto.getMessage())
                .status(RequestStatus.PENDING)
                .build();

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "REQUEST_CREATED",
                "BorrowRequest",
                saved.getId(),
                borrowerEmail,
                "Requested item '" + item.getTitle() + "' from " + dto.getStartDate() + " to " + dto.getEndDate()
        );

        // Notify item owner of incoming borrow request
        notificationService.sendNotification(
                item.getOwner(),
                "New Borrow Request",
                borrower.getFullName() + " wants to borrow \"" + item.getTitle() + "\" (" + dto.getStartDate() + " to " + dto.getEndDate() + ").",
                "REQUEST_RECEIVED",
                "/dashboard"
        );

        return mapToDto(saved, true);
    }

    private String generateSecureOtp() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        return String.valueOf(100000 + random.nextInt(900000));
    }

    @Transactional
    public List<BorrowResponseDto> getMyBorrowRequests(String borrowerEmail) {
        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<BorrowRequest> requests = borrowRequestRepository.findByBorrowerIdOrderByCreatedAtDesc(borrower.getId());
        
        // Ensure accepted requests have OTPs generated
        boolean needSave = false;
        for (BorrowRequest req : requests) {
            if (req.getStatus() == RequestStatus.ACCEPTED) {
                if (req.getPickupOtp() == null) {
                    req.setPickupOtp(generateSecureOtp());
                    needSave = true;
                }
                if (req.getReturnOtp() == null) {
                    req.setReturnOtp(generateSecureOtp());
                    needSave = true;
                }
            }
        }
        if (needSave) {
            borrowRequestRepository.saveAll(requests);
        }

        return requests.stream()
                .map(req -> mapToDto(req, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BorrowResponseDto> getRequestsReceived(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return borrowRequestRepository.findByOwnerId(owner.getId())
                .stream()
                .map(req -> mapToDto(req, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public BorrowResponseDto updateRequestStatus(Long requestId, RequestStatus newStatus, String userEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Item item = request.getItem();
        boolean isOwner = item.getOwner().getId().equals(currentUser.getId());
        boolean isBorrower = request.getBorrower().getId().equals(currentUser.getId());

        // Authorization logic for state transitions
        switch (newStatus) {
            case ACCEPTED -> {
                if (!isOwner) {
                    throw new AccessDeniedException("Only the item owner can accept requests");
                }
                // Verify no other request for this item was accepted for conflicting dates
                List<BorrowRequest> conflicts = borrowRequestRepository.findConflictingAcceptedRequests(
                        item.getId(), request.getId(), request.getStartDate(), request.getEndDate()
                );
                if (!conflicts.isEmpty()) {
                    BorrowRequest firstConflict = conflicts.get(0);
                    String borrowerName = firstConflict.getBorrower() != null ? firstConflict.getBorrower().getFullName() : "another borrower";
                    throw new IllegalArgumentException(String.format(
                            "Cannot accept: Item has already been booked from %s to %s by %s!",
                            firstConflict.getStartDate(), firstConflict.getEndDate(), borrowerName
                    ));
                }
                item.setStatus(ItemStatus.BORROWED);
                itemRepository.save(item);
                request.setStatus(RequestStatus.ACCEPTED);
                if (request.getPickupOtp() == null) {
                    request.setPickupOtp(generateSecureOtp());
                }
                if (request.getReturnOtp() == null) {
                    request.setReturnOtp(generateSecureOtp());
                }
            }
            case REJECTED -> {
                if (!isOwner) {
                    throw new AccessDeniedException("Only the item owner can reject requests");
                }
                request.setStatus(RequestStatus.REJECTED);
            }
            case CANCELLED -> {
                if (!isBorrower) {
                    throw new AccessDeniedException("Only the borrower can cancel the request");
                }
                request.setStatus(RequestStatus.CANCELLED);
            }
            case RETURNED -> {
                // Either owner or borrower can mark returned, freeing the item back to AVAILABLE
                if (!isOwner && !isBorrower) {
                    throw new AccessDeniedException("Only the owner or borrower can mark as returned");
                }
                if (request.getReturnedAt() == null) {
                    request.setReturnedAt(java.time.LocalDateTime.now());
                }
                item.setStatus(ItemStatus.AVAILABLE);
                itemRepository.save(item);
                request.setStatus(RequestStatus.RETURNED);
            }
            default -> throw new IllegalArgumentException("Unsupported status update: " + newStatus);
        }

        BorrowRequest updated = borrowRequestRepository.save(request);

        auditLogService.log(
                "STATUS_UPDATED_" + newStatus,
                "BorrowRequest",
                updated.getId(),
                userEmail,
                "Status updated to " + newStatus + " by " + currentUser.getFullName()
        );

        // Send alerts based on status change
        if (newStatus == RequestStatus.ACCEPTED) {
            notificationService.sendNotification(
                    request.getBorrower(),
                    "🎉 Request Approved!",
                    item.getOwner().getFullName() + " accepted your request for \"" + item.getTitle() + "\". Your 6-digit pickup PIN is ready in your dashboard!",
                    "REQUEST_ACCEPTED",
                    "/dashboard"
            );
        } else if (newStatus == RequestStatus.REJECTED) {
            notificationService.sendNotification(
                    request.getBorrower(),
                    "Request Declined",
                    item.getOwner().getFullName() + " was unable to accept your request for \"" + item.getTitle() + "\".",
                    "REQUEST_REJECTED",
                    "/dashboard"
            );
        } else if (newStatus == RequestStatus.RETURNED) {
            User notifyTarget = isOwner ? request.getBorrower() : item.getOwner();
            notificationService.sendNotification(
                    notifyTarget,
                    "Item Return Confirmed",
                    "\"" + item.getTitle() + "\" has been marked as returned.",
                    "RETURN_CONFIRMED",
                    "/dashboard"
            );
        }

        return mapToDto(updated, isBorrower);
    }

    @Transactional
    public BorrowResponseDto verifyPickupOtp(Long requestId, String otp, String photoUrl, String conditionNote, String ownerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getItem().getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the item owner can verify the handover pickup PIN");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Item request must be Accepted before pickup verification");
        }

        if (request.getHandoverAt() != null) {
            throw new IllegalArgumentException("Handover PIN has already been verified!");
        }

        // 1. Check if security lockout is active
        if (request.getPickupLockoutUntil() != null) {
            if (java.time.LocalDateTime.now().isBefore(request.getPickupLockoutUntil())) {
                long minutesLeft = java.time.Duration.between(java.time.LocalDateTime.now(), request.getPickupLockoutUntil()).toMinutes() + 1;
                throw new IllegalArgumentException("🚨 Security Lockout: Too many failed PIN attempts! Verification is locked. Please try again in " + minutesLeft + " minute(s).");
            } else {
                // Lockout window expired, clear lockout and reset attempts
                request.setPickupLockoutUntil(null);
                request.setPickupAttempts(0);
            }
        }

        // 2. Validate OTP with Brute-Force Rate Limiting
        if (otp == null || !otp.trim().equals(request.getPickupOtp())) {
            int attempts = (request.getPickupAttempts() != null ? request.getPickupAttempts() : 0) + 1;
            request.setPickupAttempts(attempts);

            if (attempts >= 5) {
                request.setPickupLockoutUntil(java.time.LocalDateTime.now().plusMinutes(10));
                borrowRequestRepository.save(request);

                auditLogService.log(
                        "PIN_LOCKOUT_TRIGGERED",
                        "BorrowRequest",
                        request.getId(),
                        ownerEmail,
                        "5 failed pickup PIN attempts triggered 10-minute lockout"
                );

                // Send security alerts
                notificationService.sendNotification(
                        currentUser,
                        "🚨 Security Lockout: Pickup Verification Locked",
                        "Handover for \"" + request.getItem().getTitle() + "\" has been temporarily locked for 10 minutes due to 5 consecutive incorrect PIN attempts.",
                        "SECURITY_LOCKOUT",
                        "/dashboard"
                );
                notificationService.sendNotification(
                        request.getBorrower(),
                        "🚨 Security Lockout: Pickup Verification Locked",
                        "Pickup PIN verification for \"" + request.getItem().getTitle() + "\" has been locked for 10 minutes due to 5 consecutive incorrect attempts.",
                        "SECURITY_LOCKOUT",
                        "/dashboard"
                );

                throw new IllegalArgumentException("Maximum attempts reached! Verification locked for 10 minutes for account security.");
            }

            borrowRequestRepository.save(request);
            int remaining = 5 - attempts;
            throw new IllegalArgumentException("Invalid Pickup PIN! " + remaining + " attempt(s) remaining before security lockout.");
        }

        // 3. Success: Reset attempt counters
        request.setPickupAttempts(0);
        request.setPickupLockoutUntil(null);
        request.setHandoverAt(java.time.LocalDateTime.now());
        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            request.setPickupPhotoUrl(photoUrl.trim());
        }
        if (conditionNote != null && !conditionNote.trim().isEmpty()) {
            request.setPickupConditionNote(conditionNote.trim());
        }

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "HANDOVER_VERIFIED",
                "BorrowRequest",
                saved.getId(),
                ownerEmail,
                "Handover verified via 6-digit PIN by lender " + currentUser.getFullName() + (photoUrl != null ? " (with condition photo)" : "")
        );

        notificationService.sendNotification(
                request.getBorrower(),
                "🔑 Handover Confirmed!",
                currentUser.getFullName() + " verified your pickup PIN for \"" + request.getItem().getTitle() + "\". Condition snapshot saved! Enjoy using it!",
                "HANDOVER_CONFIRMED",
                "/dashboard"
        );

        return mapToDto(saved, false);
    }

    @Transactional
    public BorrowResponseDto verifyPickupOtp(Long requestId, String otp, String ownerEmail) {
        return verifyPickupOtp(requestId, otp, null, null, ownerEmail);
    }

    @Transactional
    public BorrowResponseDto verifyReturnOtp(Long requestId, String otp, String photoUrl, String conditionNote, String ownerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getItem().getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the item owner can verify the return PIN");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Item is not in active accepted status");
        }

        // 1. Check if return security lockout is active
        if (request.getReturnLockoutUntil() != null) {
            if (java.time.LocalDateTime.now().isBefore(request.getReturnLockoutUntil())) {
                long minutesLeft = java.time.Duration.between(java.time.LocalDateTime.now(), request.getReturnLockoutUntil()).toMinutes() + 1;
                throw new IllegalArgumentException("🚨 Security Lockout: Too many failed PIN attempts! Return verification is locked. Please try again in " + minutesLeft + " minute(s).");
            } else {
                // Lockout window expired, clear lockout and reset attempts
                request.setReturnLockoutUntil(null);
                request.setReturnAttempts(0);
            }
        }

        // 2. Validate Return OTP with Brute-Force Rate Limiting
        if (otp == null || !otp.trim().equals(request.getReturnOtp())) {
            int attempts = (request.getReturnAttempts() != null ? request.getReturnAttempts() : 0) + 1;
            request.setReturnAttempts(attempts);

            if (attempts >= 5) {
                request.setReturnLockoutUntil(java.time.LocalDateTime.now().plusMinutes(10));
                borrowRequestRepository.save(request);

                auditLogService.log(
                        "PIN_LOCKOUT_TRIGGERED",
                        "BorrowRequest",
                        request.getId(),
                        ownerEmail,
                        "5 failed return PIN attempts triggered 10-minute lockout"
                );

                // Send security alerts
                notificationService.sendNotification(
                        currentUser,
                        "🚨 Security Lockout: Return Verification Locked",
                        "Return verification for \"" + request.getItem().getTitle() + "\" has been temporarily locked for 10 minutes due to 5 consecutive incorrect PIN attempts.",
                        "SECURITY_LOCKOUT",
                        "/dashboard"
                );
                notificationService.sendNotification(
                        request.getBorrower(),
                        "🚨 Security Lockout: Return Verification Locked",
                        "Return PIN verification for \"" + request.getItem().getTitle() + "\" has been locked for 10 minutes due to 5 consecutive incorrect attempts.",
                        "SECURITY_LOCKOUT",
                        "/dashboard"
                );

                throw new IllegalArgumentException("Maximum attempts reached! Return verification locked for 10 minutes for account security.");
            }

            borrowRequestRepository.save(request);
            int remaining = 5 - attempts;
            throw new IllegalArgumentException("Invalid Return PIN! " + remaining + " attempt(s) remaining before security lockout.");
        }

        // 3. Success: Reset return attempt counters
        request.setReturnAttempts(0);
        request.setReturnLockoutUntil(null);
        request.setReturnedAt(java.time.LocalDateTime.now());
        request.setStatus(RequestStatus.RETURNED);
        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            request.setReturnPhotoUrl(photoUrl.trim());
        }
        if (conditionNote != null && !conditionNote.trim().isEmpty()) {
            request.setReturnConditionNote(conditionNote.trim());
        }

        Item item = request.getItem();
        item.setStatus(ItemStatus.AVAILABLE);
        itemRepository.save(item);

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "RETURN_VERIFIED",
                "BorrowRequest",
                saved.getId(),
                ownerEmail,
                "Return verified via 6-digit PIN by lender " + currentUser.getFullName() + (photoUrl != null ? " (with condition photo)" : "")
        );

        notificationService.sendNotification(
                request.getBorrower(),
                "🛡️ Return Verified!",
                currentUser.getFullName() + " verified your return PIN for \"" + request.getItem().getTitle() + "\". Return condition snapshot recorded safely!",
                "RETURN_CONFIRMED",
                "/dashboard"
        );

        return mapToDto(saved, false);
    }

    @Transactional
    public BorrowResponseDto verifyReturnOtp(Long requestId, String otp, String ownerEmail) {
        return verifyReturnOtp(requestId, otp, null, null, ownerEmail);
    }

    @Transactional(readOnly = true)
    public List<Map<String, String>> getBookedDateRanges(Long itemId) {
        return borrowRequestRepository.findByItemIdAndStatus(itemId, RequestStatus.ACCEPTED)
                .stream()
                .filter(req -> !req.getEndDate().isBefore(java.time.LocalDate.now()))
                .sorted(java.util.Comparator.comparing(BorrowRequest::getStartDate))
                .map(req -> Map.of(
                        "startDate", req.getStartDate().toString(),
                        "endDate", req.getEndDate().toString()
                ))
                .collect(Collectors.toList());
    }

    public BorrowResponseDto mapToDto(BorrowRequest req) {
        return mapToDto(req, false);
    }

    public BorrowResponseDto mapToDto(BorrowRequest req, boolean isBorrower) {
        UserTrustDto borrowerTrust = (!isBorrower && req.getBorrower() != null)
                ? userTrustService.getTrustScore(req.getBorrower().getId())
                : null;

        return BorrowResponseDto.builder()
                .id(req.getId())
                .itemId(req.getItem().getId())
                .itemTitle(req.getItem().getTitle())
                .itemCategory(req.getItem().getCategory())
                .itemImageUrl(req.getItem().getImageUrl())
                .ownerId(req.getItem().getOwner().getId())
                .ownerName(req.getItem().getOwner().getFullName())
                .ownerEmail(req.getItem().getOwner().getEmail())
                .ownerPhone(req.getItem().getOwner().getPhone())
                .borrowerId(req.getBorrower().getId())
                .borrowerName(req.getBorrower().getFullName())
                .borrowerEmail(req.getBorrower().getEmail())
                .borrowerPhone(req.getBorrower().getPhone())
                .borrowerTrust(borrowerTrust)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .message(req.getMessage())
                .status(req.getStatus())
                .pickupOtp(isBorrower ? req.getPickupOtp() : null)
                .returnOtp(isBorrower ? req.getReturnOtp() : null)
                .handoverAt(req.getHandoverAt())
                .returnedAt(req.getReturnedAt())
                .pickupLockoutUntil(req.getPickupLockoutUntil())
                .returnLockoutUntil(req.getReturnLockoutUntil())
                .pickupPhotoUrl(req.getPickupPhotoUrl())
                .pickupConditionNote(req.getPickupConditionNote())
                .returnPhotoUrl(req.getReturnPhotoUrl())
                .returnConditionNote(req.getReturnConditionNote())
                .extensionProposedEndDate(req.getExtensionProposedEndDate())
                .extensionStatus(req.getExtensionStatus())
                .extensionReason(req.getExtensionReason())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }

    @Transactional
    public BorrowResponseDto requestExtension(Long requestId, java.time.LocalDate newEndDate, String reason, String borrowerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User borrower = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getBorrower().getId().equals(borrower.getId())) {
            throw new AccessDeniedException("Only the borrower can request a return date extension");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Can only extend active accepted borrow requests");
        }

        if (newEndDate == null || !newEndDate.isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("New return date must be after current return date (" + request.getEndDate() + ")");
        }

        Item item = request.getItem();

        // Date Conflict Shield: Check if another neighbor booked this item during the extension window
        java.time.LocalDate checkStart = request.getEndDate().plusDays(1);
        List<BorrowRequest> conflicts = borrowRequestRepository.findConflictingAcceptedRequests(
                item.getId(), request.getId(), checkStart, newEndDate
        );

        if (!conflicts.isEmpty()) {
            BorrowRequest firstConflict = conflicts.get(0);
            String otherBorrower = firstConflict.getBorrower() != null ? firstConflict.getBorrower().getFullName() : "another neighbor";
            throw new IllegalArgumentException(String.format(
                    "Cannot extend: \"%s\" is already reserved by %s from %s to %s.",
                    item.getTitle(), otherBorrower, firstConflict.getStartDate(), firstConflict.getEndDate()
            ));
        }

        request.setExtensionProposedEndDate(newEndDate);
        request.setExtensionStatus("PENDING");
        request.setExtensionReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Needs item for longer");

        BorrowRequest saved = borrowRequestRepository.save(request);

        // Notify item owner
        notificationService.sendNotification(
                item.getOwner(),
                "🔄 Extension Requested",
                borrower.getFullName() + " requested to extend return date for \"" + item.getTitle() + "\" to " + newEndDate + ".",
                "EXTENSION_REQUESTED",
                "/dashboard"
        );

        return mapToDto(saved, true);
    }

    @Transactional
    public BorrowResponseDto respondToExtension(Long requestId, boolean approve, String ownerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Item item = request.getItem();
        if (!item.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Only the item owner can respond to extension requests");
        }

        if (!"PENDING".equalsIgnoreCase(request.getExtensionStatus())) {
            throw new IllegalArgumentException("No pending extension request for this booking");
        }

        if (approve) {
            java.time.LocalDate newEndDate = request.getExtensionProposedEndDate();
            // Re-verify Date Conflict Shield before final confirmation
            java.time.LocalDate checkStart = request.getEndDate().plusDays(1);
            List<BorrowRequest> conflicts = borrowRequestRepository.findConflictingAcceptedRequests(
                    item.getId(), request.getId(), checkStart, newEndDate
            );
            if (!conflicts.isEmpty()) {
                throw new IllegalArgumentException("Cannot approve: Conflicting booking exists during the extension period.");
            }

            request.setEndDate(newEndDate);
            request.setExtensionStatus("APPROVED");

            // Notify borrower
            notificationService.sendNotification(
                    request.getBorrower(),
                    "✓ Extension Approved!",
                    owner.getFullName() + " approved your return extension for \"" + item.getTitle() + "\" until " + newEndDate + ".",
                    "EXTENSION_APPROVED",
                    "/dashboard"
            );
        } else {
            request.setExtensionStatus("REJECTED");

            // Notify borrower
            notificationService.sendNotification(
                    request.getBorrower(),
                    "Extension Declined",
                    owner.getFullName() + " declined the return extension for \"" + item.getTitle() + "\". Please return by " + request.getEndDate() + ".",
                    "EXTENSION_DECLINED",
                    "/dashboard"
            );
        }

        BorrowRequest saved = borrowRequestRepository.save(request);
        return mapToDto(saved, false);
    }
}
