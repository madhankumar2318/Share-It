package com.shareit.service;

import com.shareit.dto.ItemRequestDto;
import com.shareit.dto.ItemResponseDto;
import com.shareit.model.Item;
import com.shareit.model.ItemStatus;
import com.shareit.model.User;
import com.shareit.repository.ItemRepository;
import com.shareit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    @Transactional
    public ItemResponseDto createItem(ItemRequestDto dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Item item = Item.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .imageUrl(dto.getImageUrl())
                .location(dto.getLocation() != null && !dto.getLocation().trim().isEmpty() ? dto.getLocation() : "Local Community")
                .status(dto.getStatus() != null ? dto.getStatus() : ItemStatus.AVAILABLE)
                .owner(user)
                .build();

        Item saved = itemRepository.save(item);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ItemResponseDto> getAllItems(String category, String search, String location, ItemStatus status) {
        String cleanCategory = (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All")) ? category.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanLocation = (location != null && !location.trim().isEmpty() && !location.equalsIgnoreCase("All") && !location.equalsIgnoreCase("All India")) ? location.trim() : null;

        org.springframework.data.jpa.domain.Specification<Item> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

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

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        List<Item> items = itemRepository.findAll(spec);
        return items.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItemResponseDto getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + id));
        return mapToDto(item);
    }

    @Transactional(readOnly = true)
    public List<ItemResponseDto> getMyItems(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return itemRepository.findByOwnerId(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ItemResponseDto updateItem(Long id, ItemRequestDto dto, String userEmail) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + id));

        if (!item.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You are not authorized to update this item");
        }

        item.setTitle(dto.getTitle());
        item.setDescription(dto.getDescription());
        item.setCategory(dto.getCategory());
        if (dto.getImageUrl() != null) {
            item.setImageUrl(dto.getImageUrl());
        }
        if (dto.getLocation() != null) {
            item.setLocation(dto.getLocation());
        }
        if (dto.getStatus() != null) {
            item.setStatus(dto.getStatus());
        }

        Item updated = itemRepository.save(item);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteItem(Long id, String userEmail) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + id));

        if (!item.getOwner().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You are not authorized to delete this item");
        }

        itemRepository.delete(item);
    }

    public ItemResponseDto mapToDto(Item item) {
        return ItemResponseDto.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .category(item.getCategory())
                .imageUrl(item.getImageUrl())
                .location(item.getLocation())
                .status(item.getStatus())
                .ownerId(item.getOwner().getId())
                .ownerName(item.getOwner().getFullName())
                .ownerEmail(item.getOwner().getEmail())
                .ownerPhone(item.getOwner().getPhone())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
