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

        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;
        int totalDays = (int) Math.max(1, daysBetween);
        double rate = item.getDailyRate() != null ? item.getDailyRate() : 0.0;
        double deposit = item.getSecurityDeposit() != null ? item.getSecurityDeposit() : 0.0;
        double totalRentalFee = rate * totalDays;
        double refund = Math.max(0.0, deposit - totalRentalFee);
        String paymentStatus = (rate > 0 || deposit > 0) ? "PENDING_HANDOVER" : "FREE";

        BorrowRequest request = BorrowRequest.builder()
                .item(item)
                .borrower(borrower)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .message(dto.getMessage())
                .status(RequestStatus.PENDING)
                .dailyRate(rate)
                .securityDeposit(deposit)
                .totalDays(totalDays)
                .totalRentalFee(totalRentalFee)
                .refundAmount(refund)
                .paymentStatus(paymentStatus)
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

    private volatile long lastReminderRunTimestamp = 0;

    private void checkAutomatedRemindersOpportunistically() {
        long now = System.currentTimeMillis();
        if (now - lastReminderRunTimestamp > 15 * 60 * 1000) {
            lastReminderRunTimestamp = now;
            try {
                runAutomatedDueReminders();
            } catch (Exception e) {
                // Ignore opportunistic reminder errors
            }
        }
    }

    @Transactional
    public List<BorrowResponseDto> getMyBorrowRequests(String borrowerEmail) {
        checkAutomatedRemindersOpportunistically();
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

                // 🔒 Automatic Calendar Lock: Auto-reject any other PENDING requests for this item that overlap with these approved dates
                List<BorrowRequest> otherPending = borrowRequestRepository.findByItemIdAndStatus(item.getId(), RequestStatus.PENDING);
                for (BorrowRequest other : otherPending) {
                    if (!other.getId().equals(request.getId())) {
                        boolean overlaps = (other.getStartDate().compareTo(request.getEndDate()) <= 0) &&
                                           (other.getEndDate().compareTo(request.getStartDate()) >= 0);
                        if (overlaps) {
                            other.setStatus(RequestStatus.REJECTED);
                            borrowRequestRepository.save(other);

                            notificationService.sendNotification(
                                    other.getBorrower(),
                                    "📅 Dates Booked by Another Neighbor",
                                    String.format("Sorry, \"%s\" was just booked by another neighbor for overlapping dates (%s to %s). Check the calendar for other open dates!",
                                            item.getTitle(), request.getStartDate(), request.getEndDate()),
                                    "REQUEST_DECLINED",
                                    "/items/" + item.getId()
                            );
                        }
                    }
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
        if (!"FREE".equalsIgnoreCase(request.getPaymentStatus())) {
            request.setPaymentStatus("ADVANCE_PAID");
            request.setAdvancePaidAt(java.time.LocalDateTime.now());
        }
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

        // Compute final rental fee and balance refund settlement
        long scheduledDays = request.getTotalDays() != null ? request.getTotalDays() : 1;
        long actualDays = Math.max(scheduledDays, java.time.temporal.ChronoUnit.DAYS.between(request.getStartDate(), java.time.LocalDate.now()) + 1);
        double rate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
        double deposit = request.getSecurityDeposit() != null ? request.getSecurityDeposit() : 0.0;
        double finalRental = rate * actualDays;
        double finalRefund = Math.max(0.0, deposit - finalRental);

        request.setTotalDays((int) actualDays);
        request.setTotalRentalFee(finalRental);
        request.setRefundAmount(finalRefund);
        if (!"FREE".equalsIgnoreCase(request.getPaymentStatus())) {
            request.setPaymentStatus("REFUND_SETTLED");
            request.setRefundSettledAt(java.time.LocalDateTime.now());
        }

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
                .filter(req -> req.getReturnedAt() == null)
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
                .lastReminderSentAt(req.getLastReminderSentAt())
                .isContactless(req.getIsContactless())
                .dropoffLocation(req.getDropoffLocation())
                .dropoffPhotoUrl(req.getDropoffPhotoUrl())
                .dropoffNote(req.getDropoffNote())
                .dropoffAt(req.getDropoffAt())
                .dropoffPasscode(req.getDropoffPasscode())
                .dropoffStatus(req.getDropoffStatus())
                .returnDropoffLocation(req.getReturnDropoffLocation())
                .returnDropoffPhotoUrl(req.getReturnDropoffPhotoUrl())
                .returnDropoffNote(req.getReturnDropoffNote())
                .returnDropoffAt(req.getReturnDropoffAt())
                .returnDropoffStatus(req.getReturnDropoffStatus())
                .dailyRate(req.getDailyRate())
                .securityDeposit(req.getSecurityDeposit())
                .totalDays(req.getTotalDays())
                .totalRentalFee(req.getTotalRentalFee())
                .refundAmount(req.getRefundAmount())
                .paymentStatus(req.getPaymentStatus())
                .advancePaidAt(req.getAdvancePaidAt())
                .refundSettledAt(req.getRefundSettledAt())
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

    @Transactional
    public BorrowResponseDto sendReturnReminder(Long requestId, String lenderEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(lenderEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Item item = request.getItem();
        if (!item.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the item owner can send return reminders");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED || request.getReturnedAt() != null) {
            throw new IllegalArgumentException("Cannot send reminder for an inactive or already returned booking");
        }

        // Rate limit: Allow max 1 manual reminder every 12 hours
        if (request.getLastReminderSentAt() != null) {
            long hoursSinceLast = java.time.Duration.between(request.getLastReminderSentAt(), java.time.LocalDateTime.now()).toHours();
            if (hoursSinceLast < 12) {
                long hoursLeft = 12 - hoursSinceLast;
                throw new IllegalArgumentException("A return reminder was already sent recently. You can nudge again in " + hoursLeft + " hour(s).");
            }
        }

        // Polite, warm in-app notification to borrower
        String friendlyMessage = String.format(
                "Reminder: Please return \"%s\" to %s by 6 PM today! Have your 6-digit Return PIN or QR ready for easy handover.",
                item.getTitle(),
                currentUser.getFullName()
        );

        notificationService.sendNotification(
                request.getBorrower(),
                "⏰ Gentle Return Reminder",
                friendlyMessage,
                "RETURN_REMINDER",
                "/dashboard"
        );

        request.setLastReminderSentAt(java.time.LocalDateTime.now());
        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "LENDER_SENT_RETURN_REMINDER",
                "BorrowRequest",
                saved.getId(),
                lenderEmail,
                "Lender sent gentle return reminder to borrower " + request.getBorrower().getFullName()
        );

        return mapToDto(saved, false);
    }

    /**
     * Automated background scheduler: Runs daily at 9:00 AM and 6:00 PM to gently remind
     * borrowers whose rental return is due tomorrow, today, or overdue.
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 9,18 * * *")
    @Transactional
    public void runAutomatedDueReminders() {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate tomorrow = today.plusDays(1);

        List<BorrowRequest> dueRequests = borrowRequestRepository.findActiveRequestsDueSoon(tomorrow);

        for (BorrowRequest req : dueRequests) {
            // Check if already reminded in the last 20 hours to prevent duplicate pings
            if (req.getLastReminderSentAt() != null) {
                long hoursSinceLast = java.time.Duration.between(req.getLastReminderSentAt(), java.time.LocalDateTime.now()).toHours();
                if (hoursSinceLast < 20) {
                    continue;
                }
            }

            String title;
            String message;

            if (req.getEndDate().isEqual(tomorrow)) {
                title = "⏰ Return Due Tomorrow!";
                message = String.format(
                        "Friendly reminder: \"%s\" from %s is due for return tomorrow (%s). Need extra time? Request a 1-day extension on your dashboard!",
                        req.getItem().getTitle(),
                        req.getItem().getOwner().getFullName(),
                        req.getEndDate()
                );
            } else if (req.getEndDate().isEqual(today)) {
                title = "⏰ Return Due Today!";
                message = String.format(
                        "Reminder: Please return \"%s\" to %s by 6 PM today! Have your 6-digit Return PIN or QR code ready.",
                        req.getItem().getTitle(),
                        req.getItem().getOwner().getFullName()
                );

                // Also notify the lender so they know today is return day
                notificationService.sendNotification(
                        req.getItem().getOwner(),
                        "📅 Return Due Today: " + req.getItem().getTitle(),
                        String.format("%s is scheduled to return \"%s\" today. Confirm handover on your dashboard using their Return PIN or QR code.",
                                req.getBorrower().getFullName(),
                                req.getItem().getTitle()),
                        "RETURN_DUE",
                        "/dashboard"
                );
            } else {
                title = "⚠️ Overdue Return Notice";
                message = String.format(
                        "Hi %s! \"%s\" from %s was due on %s. Please arrange return as soon as possible, or request an extension on your dashboard.",
                        req.getBorrower().getFullName(),
                        req.getItem().getTitle(),
                        req.getItem().getOwner().getFullName(),
                        req.getEndDate()
                );
            }

            notificationService.sendNotification(
                    req.getBorrower(),
                    title,
                    message,
                    "RETURN_REMINDER",
                    "/dashboard"
            );

            req.setLastReminderSentAt(java.time.LocalDateTime.now());
            borrowRequestRepository.save(req);

            auditLogService.log(
                    "AUTOMATED_RETURN_REMINDER",
                    "BorrowRequest",
                    req.getId(),
                    "system@shareit.local",
                    "Automated reminder dispatched: " + title
            );
        }
    }

    @Transactional
    public BorrowResponseDto recordContactlessDropoff(Long requestId, String location, String photoUrl, String note, String passcode, String ownerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getItem().getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the item owner can record contactless drop-off");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Item request must be Accepted before recording drop-off");
        }

        if (location == null || location.trim().isEmpty()) {
            throw new IllegalArgumentException("Drop-off spot or location is required (e.g. Main Gate Security, Doorstep)");
        }

        String securePasscode = (passcode != null && !passcode.trim().isEmpty())
                ? passcode.trim()
                : String.format("%04d", new java.security.SecureRandom().nextInt(10000));

        request.setIsContactless(true);
        request.setDropoffLocation(location.trim());
        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            request.setDropoffPhotoUrl(photoUrl.trim());
        }
        if (note != null && !note.trim().isEmpty()) {
            request.setDropoffNote(note.trim());
        }
        request.setDropoffPasscode(securePasscode);
        request.setDropoffAt(java.time.LocalDateTime.now());
        request.setDropoffStatus("DROPPED_OFF");

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "CONTACTLESS_DROPOFF",
                "BorrowRequest",
                saved.getId(),
                ownerEmail,
                "Item dropped off at " + location.trim() + " with passcode: " + securePasscode
        );

        notificationService.sendNotification(
                request.getBorrower(),
                "🚪 Item Dropped Off at " + location.trim(),
                currentUser.getFullName() + " left \"" + request.getItem().getTitle() + "\" at: " + location.trim()
                        + ". Collection Passcode: " + securePasscode + ". Check your dashboard for drop-off details & photo!",
                "ITEM_DROPPED_OFF",
                "/dashboard"
        );

        return mapToDto(saved, false);
    }

    @Transactional
    public BorrowResponseDto confirmContactlessPickup(Long requestId, String photoUrl, String conditionNote, String userEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isBorrower = request.getBorrower().getId().equals(currentUser.getId());
        boolean isOwner = request.getItem().getOwner().getId().equals(currentUser.getId());

        if (!isBorrower && !isOwner) {
            throw new AccessDeniedException("Only the borrower or owner can confirm contactless pickup");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED) {
            throw new IllegalArgumentException("Request must be in Accepted status");
        }

        if (!"DROPPED_OFF".equals(request.getDropoffStatus())) {
            throw new IllegalArgumentException("Item has not been recorded as dropped off yet");
        }

        request.setDropoffStatus("COLLECTED");
        request.setHandoverAt(java.time.LocalDateTime.now());
        if (!"FREE".equalsIgnoreCase(request.getPaymentStatus())) {
            request.setPaymentStatus("ADVANCE_PAID");
            request.setAdvancePaidAt(java.time.LocalDateTime.now());
        }

        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            request.setPickupPhotoUrl(photoUrl.trim());
        }
        if (conditionNote != null && !conditionNote.trim().isEmpty()) {
            request.setPickupConditionNote(conditionNote.trim());
        }

        if (request.getReturnOtp() == null) {
            request.setReturnOtp(generateSecureOtp());
        }

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "CONTACTLESS_COLLECTED",
                "BorrowRequest",
                saved.getId(),
                userEmail,
                "Item collected from drop-off spot (" + request.getDropoffLocation() + ") by " + currentUser.getFullName()
        );

        if (isBorrower) {
            notificationService.sendNotification(
                    request.getItem().getOwner(),
                    "✅ Item Collected from Drop-off Spot!",
                    currentUser.getFullName() + " collected \"" + request.getItem().getTitle() + "\" from "
                            + (request.getDropoffLocation() != null ? request.getDropoffLocation() : "the drop-off spot")
                            + ". Handover is complete and active!",
                    "HANDOVER_CONFIRMED",
                    "/dashboard"
            );
        } else {
            notificationService.sendNotification(
                    request.getBorrower(),
                    "✅ Handover Active!",
                    "Pickup confirmed for \"" + request.getItem().getTitle() + "\". Enjoy using it!",
                    "HANDOVER_CONFIRMED",
                    "/dashboard"
            );
        }

        return mapToDto(saved, isBorrower);
    }

    @Transactional
    public BorrowResponseDto recordContactlessReturn(Long requestId, String location, String photoUrl, String note, String borrowerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(borrowerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getBorrower().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the borrower can record contactless return drop-off");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED || request.getHandoverAt() == null || request.getReturnedAt() != null) {
            throw new IllegalArgumentException("Item must be currently active to record return drop-off");
        }

        if (location == null || location.trim().isEmpty()) {
            throw new IllegalArgumentException("Return drop-off spot or location is required");
        }

        request.setReturnDropoffLocation(location.trim());
        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            request.setReturnDropoffPhotoUrl(photoUrl.trim());
            request.setReturnPhotoUrl(photoUrl.trim());
        }
        if (note != null && !note.trim().isEmpty()) {
            request.setReturnDropoffNote(note.trim());
            request.setReturnConditionNote(note.trim());
        }
        request.setReturnDropoffAt(java.time.LocalDateTime.now());
        request.setReturnDropoffStatus("DROPPED_OFF");

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "CONTACTLESS_RETURN_DROPOFF",
                "BorrowRequest",
                saved.getId(),
                borrowerEmail,
                "Item returned to drop-off spot: " + location.trim()
        );

        notificationService.sendNotification(
                request.getItem().getOwner(),
                "🚪 Item Returned to Drop-Off Spot!",
                currentUser.getFullName() + " returned \"" + request.getItem().getTitle() + "\" at: " + location.trim()
                        + ". Check the condition photo in your dashboard and confirm safe return.",
                "RETURN_DROPPED_OFF",
                "/dashboard"
        );

        return mapToDto(saved, true);
    }

    @Transactional
    public BorrowResponseDto confirmContactlessReturn(Long requestId, String photoUrl, String conditionNote, String ownerEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getItem().getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the item owner can confirm return");
        }

        if (request.getStatus() != RequestStatus.ACCEPTED || request.getHandoverAt() == null) {
            throw new IllegalArgumentException("Item request must be in active status");
        }

        if (!"DROPPED_OFF".equals(request.getReturnDropoffStatus())) {
            throw new IllegalArgumentException("Return drop-off has not been recorded yet");
        }

        request.setReturnDropoffStatus("COLLECTED");
        request.setStatus(RequestStatus.RETURNED);
        request.setReturnedAt(java.time.LocalDateTime.now());

        // Compute final rental fee and balance refund settlement
        long scheduledDays = request.getTotalDays() != null ? request.getTotalDays() : 1;
        long actualDays = Math.max(scheduledDays, java.time.temporal.ChronoUnit.DAYS.between(request.getStartDate(), java.time.LocalDate.now()) + 1);
        double rate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
        double deposit = request.getSecurityDeposit() != null ? request.getSecurityDeposit() : 0.0;
        double finalRental = rate * actualDays;
        double finalRefund = Math.max(0.0, deposit - finalRental);

        request.setTotalDays((int) actualDays);
        request.setTotalRentalFee(finalRental);
        request.setRefundAmount(finalRefund);
        if (!"FREE".equalsIgnoreCase(request.getPaymentStatus())) {
            request.setPaymentStatus("REFUND_SETTLED");
            request.setRefundSettledAt(java.time.LocalDateTime.now());
        }

        if (photoUrl != null && !photoUrl.trim().isEmpty()) {
            request.setReturnPhotoUrl(photoUrl.trim());
        }
        if (conditionNote != null && !conditionNote.trim().isEmpty()) {
            request.setReturnConditionNote(conditionNote.trim());
        }

        // Release item back to available
        request.getItem().setStatus(com.shareit.model.ItemStatus.AVAILABLE);

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "CONTACTLESS_RETURN_CONFIRMED",
                "BorrowRequest",
                saved.getId(),
                ownerEmail,
                "Return confirmed by owner " + currentUser.getFullName() + " from drop-off spot"
        );

        notificationService.sendNotification(
                request.getBorrower(),
                "🎉 Return Confirmed!",
                currentUser.getFullName() + " retrieved \"" + request.getItem().getTitle() + "\" and confirmed safe return. Thank you for sharing!",
                "RETURN_CONFIRMED",
                "/dashboard"
        );

        return mapToDto(saved, false);
    }

    @Transactional
    public BorrowResponseDto settleRefund(Long requestId, Double customRefund, String userEmail) {
        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found with id: " + requestId));

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!request.getItem().getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the item owner can settle the refund");
        }

        if (customRefund != null && customRefund >= 0) {
            request.setRefundAmount(customRefund);
        }
        request.setPaymentStatus("REFUND_SETTLED");
        request.setRefundSettledAt(java.time.LocalDateTime.now());

        BorrowRequest saved = borrowRequestRepository.save(request);

        auditLogService.log(
                "REFUND_SETTLED",
                "BorrowRequest",
                saved.getId(),
                userEmail,
                "Advance refund of ₹" + saved.getRefundAmount() + " settled and handed back to borrower"
        );

        notificationService.sendNotification(
                request.getBorrower(),
                "💰 Advance Deposit Refund Settled!",
                "Your refund balance of ₹" + saved.getRefundAmount() + " for \"" + request.getItem().getTitle() + "\" has been settled by " + currentUser.getFullName() + ".",
                "REFUND_SETTLED",
                "/dashboard"
        );

        return mapToDto(saved, false);
    }
}
