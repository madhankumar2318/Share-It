package com.shareit.controller;

import com.shareit.dto.WishlistOfferDto;
import com.shareit.dto.WishlistRequestDto;
import com.shareit.dto.WishlistResponseDto;
import com.shareit.model.WishlistStatus;
import com.shareit.service.ItemWishlistService;
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
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ItemWishlistController {

    private final ItemWishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistResponseDto>> getAllWishlists(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) WishlistStatus status) {
        return ResponseEntity.ok(wishlistService.getAllWishlists(category, search, location, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WishlistResponseDto> getWishlistById(@PathVariable Long id) {
        return ResponseEntity.ok(wishlistService.getWishlistById(id));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<WishlistResponseDto>> getMyWishlists(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(wishlistService.getMyWishlists(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<WishlistResponseDto> createWishlist(
            @Valid @RequestBody WishlistRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(wishlistService.createWishlist(dto, userDetails.getUsername()), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WishlistResponseDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String statusStr = payload.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Field 'status' is required");
        }
        WishlistStatus newStatus = WishlistStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(wishlistService.updateWishlistStatus(id, newStatus, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWishlist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        wishlistService.deleteWishlist(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/offers")
    public ResponseEntity<WishlistOfferDto> addOffer(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        String message = payload != null ? payload.get("message") : null;
        return new ResponseEntity<>(wishlistService.addOffer(id, message, userDetails.getUsername()), HttpStatus.CREATED);
    }
}
