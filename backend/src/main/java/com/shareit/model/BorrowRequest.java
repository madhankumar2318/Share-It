package com.shareit.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "borrow_requests",
    indexes = {
        @Index(name = "idx_borrow_item_id", columnList = "item_id"),
        @Index(name = "idx_borrow_borrower_id", columnList = "borrower_id"),
        @Index(name = "idx_borrow_status", columnList = "status"),
        @Index(name = "idx_borrow_created_at", columnList = "createdAt")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BorrowRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The item requested
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    // The user who wants to borrow the item
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrower_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User borrower;

    @NotNull
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(nullable = false)
    private LocalDate endDate;

    @Column(length = 1000)
    private String message; // Optional note from borrower to lender

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Column(length = 10)
    private String pickupOtp;

    @Column(length = 10)
    private String returnOtp;

    private LocalDateTime handoverAt;

    private LocalDateTime returnedAt;

    @Builder.Default
    private Integer pickupAttempts = 0;

    private LocalDateTime pickupLockoutUntil;

    @Builder.Default
    private Integer returnAttempts = 0;

    private LocalDateTime returnLockoutUntil;

    @Column(length = 500)
    private String pickupPhotoUrl;

    @Column(length = 500)
    private String pickupConditionNote;

    @Column(length = 500)
    private String returnPhotoUrl;

    @Column(length = 500)
    private String returnConditionNote;

    private LocalDate extensionProposedEndDate;

    @Column(length = 50)
    private String extensionStatus; // "PENDING", "APPROVED", "REJECTED"

    @Column(length = 500)
    private String extensionReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
