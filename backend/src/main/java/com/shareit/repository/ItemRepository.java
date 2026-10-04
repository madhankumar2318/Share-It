package com.shareit.repository;

import com.shareit.model.Item;
import com.shareit.model.ItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {

    List<Item> findByOwnerId(Long ownerId);

    List<Item> findByStatus(ItemStatus status);
}
