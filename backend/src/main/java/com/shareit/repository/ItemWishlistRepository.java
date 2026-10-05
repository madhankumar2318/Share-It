package com.shareit.repository;

import com.shareit.model.ItemWishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemWishlistRepository extends JpaRepository<ItemWishlist, Long>, JpaSpecificationExecutor<ItemWishlist> {
    List<ItemWishlist> findByUserIdOrderByCreatedAtDesc(Long userId);
}
