package com.shareit.repository;

import com.shareit.model.Item;
import com.shareit.model.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByOwnerId(Long ownerId);

    List<Item> findByStatus(ItemStatus status);

    @Query("SELECT i FROM Item i WHERE " +
           "(:category IS NULL OR LOWER(i.category) = LOWER(:category)) AND " +
           "(:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR i.status = :status)")
    List<Item> searchItems(@Param("category") String category,
                           @Param("search") String search,
                           @Param("status") ItemStatus status);
}
