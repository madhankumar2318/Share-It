package com.shareit.service;

import com.shareit.dto.WishlistOfferDto;
import com.shareit.dto.WishlistOfferMessageDto;
import com.shareit.dto.WishlistRequestDto;
import com.shareit.dto.WishlistResponseDto;
import com.shareit.model.ItemWishlist;
import com.shareit.model.User;
import com.shareit.model.WishlistOffer;
import com.shareit.model.WishlistOfferMessage;
import com.shareit.model.WishlistStatus;
import com.shareit.repository.ItemWishlistRepository;
import com.shareit.repository.UserRepository;
import com.shareit.repository.WishlistOfferMessageRepository;
import com.shareit.repository.WishlistOfferRepository;
import com.shareit.security.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemWishlistService {

    private final ItemWishlistRepository wishlistRepository;
    private final WishlistOfferRepository offerRepository;
    private final WishlistOfferMessageRepository offerMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public WishlistResponseDto createWishlist(WishlistRequestDto dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        ItemWishlist wishlist = ItemWishlist.builder()
                .title(HtmlSanitizer.sanitize(dto.getTitle()))
                .description(HtmlSanitizer.sanitize(dto.getDescription()))
                .category(HtmlSanitizer.sanitize(dto.getCategory()))
                .urgency(dto.getUrgency() != null && !dto.getUrgency().trim().isEmpty() ? HtmlSanitizer.sanitize(dto.getUrgency()) : "Flexible")
                .location(dto.getLocation() != null && !dto.getLocation().trim().isEmpty() ? HtmlSanitizer.sanitize(dto.getLocation()) : "Local Community")
                .status(WishlistStatus.OPEN)
                .user(user)
                .build();

        ItemWishlist saved = wishlistRepository.save(wishlist);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<WishlistResponseDto> getAllWishlists(String category, String search, String location, WishlistStatus status) {
        String cleanCategory = (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All")) ? category.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanLocation = (location != null && !location.trim().isEmpty() && !location.equalsIgnoreCase("All") && !location.equalsIgnoreCase("All India")) ? location.trim() : null;

        Specification<ItemWishlist> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (cleanCategory != null) {
                predicates.add(cb.equal(cb.lower(root.get("category")), cleanCategory.toLowerCase()));
            }

            if (cleanSearch != null) {
                String pattern = "%" + cleanSearch.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            if (cleanLocation != null) {
                String locPattern = "%" + cleanLocation.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("location")), locPattern));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Order by created date descending
            query.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return wishlistRepository.findAll(spec)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WishlistResponseDto getWishlistById(Long id) {
        ItemWishlist wishlist = wishlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Wishlist request not found with id: " + id));
        return mapToDto(wishlist);
    }

    @Transactional(readOnly = true)
    public List<WishlistResponseDto> getMyWishlists(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public WishlistResponseDto updateWishlistStatus(Long id, WishlistStatus newStatus, String userEmail) {
        ItemWishlist wishlist = wishlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Wishlist request not found with id: " + id));

        if (!wishlist.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("Only the author can update this wishlist status");
        }

        wishlist.setStatus(newStatus);
        ItemWishlist updated = wishlistRepository.save(wishlist);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteWishlist(Long id, String userEmail) {
        ItemWishlist wishlist = wishlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Wishlist request not found with id: " + id));

        if (!wishlist.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("Only the author can delete this wishlist request");
        }

        wishlistRepository.delete(wishlist);
    }

    @Transactional
    public WishlistOfferDto addOffer(Long wishlistId, String message, String lenderEmail) {
        ItemWishlist wishlist = wishlistRepository.findById(wishlistId)
                .orElseThrow(() -> new IllegalArgumentException("Wishlist request not found with id: " + wishlistId));

        User lender = userRepository.findByEmail(lenderEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + lenderEmail));

        if (wishlist.getUser().getId().equals(lender.getId())) {
            throw new IllegalArgumentException("You cannot offer to lend your own requested item!");
        }

        if (message != null && message.trim().length() > 1000) {
            throw new IllegalArgumentException("Offer message cannot exceed 1000 characters");
        }

        WishlistOffer offer = WishlistOffer.builder()
                .wishlist(wishlist)
                .lender(lender)
                .message(message != null ? HtmlSanitizer.sanitize(message) : "I have this item available and can lend it to you!")
                .build();

        WishlistOffer saved = offerRepository.save(offer);

        // Record initial offer message in the in-app chat thread
        WishlistOfferMessage initialMessage = WishlistOfferMessage.builder()
                .offer(saved)
                .sender(lender)
                .content(saved.getMessage())
                .build();
        offerMessageRepository.save(initialMessage);

        // Notify wishlist requester about the new offer
        notificationService.sendNotification(
                wishlist.getUser(),
                "🙋 New Offer for Your Wishlist!",
                lender.getFullName() + " offered to lend their item for your request \"" + wishlist.getTitle() + "\"!",
                "WISHLIST_OFFER",
                "/wishlist?chatOfferId=" + saved.getId()
        );

        return mapOfferToDto(saved);
    }

    @Transactional
    public WishlistOfferMessageDto addOfferMessage(Long offerId, String content, String userEmail) {
        WishlistOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found: " + offerId));
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Long requesterId = offer.getWishlist().getUser().getId();
        Long lenderId = offer.getLender().getId();
        Long currentUserId = currentUser.getId();

        // Privacy & Access Control: Only the requester and this lender can exchange messages
        if (!currentUserId.equals(requesterId) && !currentUserId.equals(lenderId)) {
            throw new AccessDeniedException("You are not part of this wishlist conversation");
        }

        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        WishlistOfferMessage message = WishlistOfferMessage.builder()
                .offer(offer)
                .sender(currentUser)
                .content(HtmlSanitizer.sanitize(content.trim()))
                .build();
        WishlistOfferMessage saved = offerMessageRepository.save(message);

        // Notify other party
        boolean isRequester = currentUserId.equals(requesterId);
        User recipient = isRequester ? offer.getLender() : offer.getWishlist().getUser();
        String notificationTitle = isRequester ? "💬 Reply from Requester!" : "💬 New message for your wishlist request!";
        String snippet = content.trim().length() > 60 ? content.trim().substring(0, 57) + "..." : content.trim();
        notificationService.sendNotification(
                recipient,
                notificationTitle,
                currentUser.getFullName() + ": \"" + snippet + "\"",
                "WISHLIST_CHAT",
                "/wishlist?chatOfferId=" + offerId
        );

        return mapOfferMessageToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<WishlistOfferMessageDto> getOfferMessages(Long offerId, String userEmail) {
        WishlistOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found: " + offerId));
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Long requesterId = offer.getWishlist().getUser().getId();
        Long lenderId = offer.getLender().getId();
        Long currentUserId = currentUser.getId();

        if (!currentUserId.equals(requesterId) && !currentUserId.equals(lenderId)) {
            throw new AccessDeniedException("You are not part of this wishlist conversation");
        }

        return offerMessageRepository.findByOfferIdOrderByCreatedAtAsc(offerId)
                .stream()
                .map(this::mapOfferMessageToDto)
                .collect(Collectors.toList());
    }

    public WishlistResponseDto mapToDto(ItemWishlist w) {
        List<WishlistOfferDto> offerDtos = w.getOffers() != null
                ? w.getOffers().stream().map(this::mapOfferToDto).collect(Collectors.toList())
                : new ArrayList<>();

        return WishlistResponseDto.builder()
                .id(w.getId())
                .title(w.getTitle())
                .description(w.getDescription())
                .category(w.getCategory())
                .urgency(w.getUrgency())
                .location(w.getLocation())
                .status(w.getStatus())
                .userId(w.getUser().getId())
                .userName(w.getUser().getFullName())
                .userEmail(null) // Protected: Never expose requester email in public feed
                .userPhone(null) // Protected: Never expose requester phone number in public feed
                .offersCount(offerDtos.size())
                .offers(offerDtos)
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    public WishlistOfferDto mapOfferToDto(WishlistOffer o) {
        return WishlistOfferDto.builder()
                .id(o.getId())
                .wishlistId(o.getWishlist().getId())
                .lenderId(o.getLender().getId())
                .lenderName(o.getLender().getFullName())
                .lenderPhone(null) // Protected: Never expose lender phone number in public feed
                .message(o.getMessage())
                .createdAt(o.getCreatedAt())
                .build();
    }

    public WishlistOfferMessageDto mapOfferMessageToDto(WishlistOfferMessage m) {
        return WishlistOfferMessageDto.builder()
                .id(m.getId())
                .offerId(m.getOffer().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
