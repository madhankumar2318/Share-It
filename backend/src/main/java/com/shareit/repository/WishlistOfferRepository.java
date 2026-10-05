package com.shareit.repository;

import com.shareit.model.WishlistOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistOfferRepository extends JpaRepository<WishlistOffer, Long> {
    List<WishlistOffer> findByWishlistIdOrderByCreatedAtDesc(Long wishlistId);
}
