package com.shareit.service;

import com.shareit.dto.BorrowRequestDto;
import com.shareit.dto.BorrowResponseDto;
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
        return mapToDto(saved, true);
    }

    private String generateSecureOtp() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        return String.valueOf(1000 + random.nextInt(9000));
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
        return mapToDto(updated, isBorrower);
    }

    @Transactional
    public BorrowResponseDto verifyPickupOtp(Long requestId, String otp, String ownerEmail) {
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

        if (otp == null || !otp.trim().equals(request.getPickupOtp())) {
            throw new IllegalArgumentException("Invalid Pickup PIN! Please check with the borrower.");
        }

        request.setHandoverAt(java.time.LocalDateTime.now());
        BorrowRequest saved = borrowRequestRepository.save(request);
        return mapToDto(saved, false);
    }

    @Transactional
    public BorrowResponseDto verifyReturnOtp(Long requestId, String otp, String ownerEmail) {
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

        if (otp == null || !otp.trim().equals(request.getReturnOtp())) {
            throw new IllegalArgumentException("Invalid Return PIN! Please check with the borrower.");
        }

        request.setReturnedAt(java.time.LocalDateTime.now());
        request.setStatus(RequestStatus.RETURNED);

        Item item = request.getItem();
        item.setStatus(ItemStatus.AVAILABLE);
        itemRepository.save(item);

        BorrowRequest saved = borrowRequestRepository.save(request);
        return mapToDto(saved, false);
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
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .message(req.getMessage())
                .status(req.getStatus())
                .pickupOtp(isBorrower ? req.getPickupOtp() : null)
                .returnOtp(isBorrower ? req.getReturnOtp() : null)
                .handoverAt(req.getHandoverAt())
                .returnedAt(req.getReturnedAt())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
