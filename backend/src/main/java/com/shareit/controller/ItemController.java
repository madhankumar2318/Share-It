package com.shareit.controller;

import com.shareit.dto.ItemRequestDto;
import com.shareit.dto.ItemResponseDto;
import com.shareit.model.ItemStatus;
import com.shareit.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<List<ItemResponseDto>> getAllItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ItemStatus status) {
        return ResponseEntity.ok(itemService.getAllItems(category, search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponseDto> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItemById(id));
    }

    @GetMapping("/my-items")
    public ResponseEntity<List<ItemResponseDto>> getMyItems(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(itemService.getMyItems(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<ItemResponseDto> createItem(
            @Valid @RequestBody ItemRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(itemService.createItem(dto, userDetails.getUsername()), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponseDto> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(itemService.updateItem(id, dto, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        itemService.deleteItem(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
