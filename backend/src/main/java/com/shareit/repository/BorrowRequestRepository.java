package com.shareit.repository;

import com.shareit.model.BorrowRequest;
import com.shareit.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BorrowRequestRepository extends JpaRepository<BorrowRequest, Long> {

    // Requests made by a user (borrower view)
    List<BorrowRequest> findByBorrowerIdOrderByCreatedAtDesc(Long borrowerId);

    // Requests received for an owner's items (lender view)
    @Query("SELECT r FROM BorrowRequest r WHERE r.item.owner.id = :ownerId ORDER BY r.createdAt DESC")
    List<BorrowRequest> findByOwnerId(@Param("ownerId") Long ownerId);

    // Requests for a specific item
    List<BorrowRequest> findByItemId(Long itemId);

    // Requests by item and specific status
    List<BorrowRequest> findByItemIdAndStatus(Long itemId, RequestStatus status);

    // All returned requests where user was the borrower (completed returns history)
    @Query("SELECT r FROM BorrowRequest r WHERE r.borrower.id = :borrowerId AND r.status = 'RETURNED'")
    List<BorrowRequest> findCompletedReturnsByBorrowerId(@Param("borrowerId") Long borrowerId);

    // All returned requests where user was the item owner (completed lends history)
    @Query("SELECT r FROM BorrowRequest r WHERE r.item.owner.id = :ownerId AND r.status = 'RETURNED'")
    List<BorrowRequest> findCompletedLendsByOwnerId(@Param("ownerId") Long ownerId);

    // Find conflicting approved/active bookings for date overlap check (with optional excludeId)
    @Query("SELECT r FROM BorrowRequest r WHERE r.item.id = :itemId " +
           "AND (:excludeId IS NULL OR r.id != :excludeId) " +
           "AND r.status = 'ACCEPTED' " +
           "AND (:startDate <= r.endDate AND :endDate >= r.startDate)")
    List<BorrowRequest> findConflictingAcceptedRequests(
            @Param("itemId") Long itemId,
            @Param("excludeId") Long excludeId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate);

    default List<BorrowRequest> findConflictingAcceptedRequests(Long itemId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        return findConflictingAcceptedRequests(itemId, null, startDate, endDate);
    }
}
