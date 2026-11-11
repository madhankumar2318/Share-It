package com.shareit.repository;

import com.shareit.model.WishlistOfferMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WishlistOfferMessageRepository extends JpaRepository<WishlistOfferMessage, Long> {
    List<WishlistOfferMessage> findByOfferIdOrderByCreatedAtAsc(Long offerId);
}
