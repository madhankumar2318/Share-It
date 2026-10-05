package com.shareit.controller;

import com.shareit.dto.ItemResponseDto;
import com.shareit.service.FavoriteItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteItemController {

    private final FavoriteItemService favoriteItemService;

    @PostMapping("/{itemId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteItemService.toggleFavorite(itemId, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<ItemResponseDto>> getMyFavorites(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteItemService.getMyFavorites(userDetails.getUsername()));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<Long>> getMyFavoriteItemIds(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteItemService.getMyFavoriteItemIds(userDetails.getUsername()));
    }
}
