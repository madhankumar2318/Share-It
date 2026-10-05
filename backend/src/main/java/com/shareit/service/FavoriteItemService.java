package com.shareit.service;

import com.shareit.dto.ItemResponseDto;
import com.shareit.model.FavoriteItem;
import com.shareit.model.Item;
import com.shareit.model.User;
import com.shareit.repository.FavoriteItemRepository;
import com.shareit.repository.ItemRepository;
import com.shareit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteItemService {

    private final FavoriteItemRepository favoriteItemRepository;
    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ItemService itemService;

    @Transactional
    public Map<String, Object> toggleFavorite(Long itemId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + itemId));

        Optional<FavoriteItem> existing = favoriteItemRepository.findByUserIdAndItemId(user.getId(), item.getId());

        if (existing.isPresent()) {
            favoriteItemRepository.delete(existing.get());
            return Map.of("favorited", false, "itemId", itemId);
        } else {
            FavoriteItem fav = FavoriteItem.builder()
                    .user(user)
                    .item(item)
                    .build();
            favoriteItemRepository.save(fav);
            return Map.of("favorited", true, "itemId", itemId);
        }
    }

    @Transactional(readOnly = true)
    public List<ItemResponseDto> getMyFavorites(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        List<FavoriteItem> favorites = favoriteItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return favorites.stream()
                .map(fav -> itemService.mapToDto(fav.getItem(), false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Long> getMyFavoriteItemIds(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return favoriteItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(fav -> fav.getItem().getId())
                .collect(Collectors.toList());
    }
}
