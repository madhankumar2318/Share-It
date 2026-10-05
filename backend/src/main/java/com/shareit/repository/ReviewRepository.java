package com.shareit.repository;

import com.shareit.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByItemIdOrderByCreatedAtDesc(Long itemId);

    Optional<Review> findByBorrowRequestIdAndReviewerId(Long borrowRequestId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.item.id = :itemId")
    Double getAverageRatingByItemId(@Param("itemId") Long itemId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.item.id = :itemId")
    Long countReviewsByItemId(@Param("itemId") Long itemId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.item.owner.id = :ownerId")
    Double getAverageRatingByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.item.owner.id = :ownerId")
    Long countReviewsByOwnerId(@Param("ownerId") Long ownerId);
}
