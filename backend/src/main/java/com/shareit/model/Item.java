package com.shareit.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "items",
    indexes = {
        @Index(name = "idx_item_status", columnList = "status"),
        @Index(name = "idx_item_category", columnList = "category"),
        @Index(name = "idx_item_owner", columnList = "owner_id"),
        @Index(name = "idx_item_created_at", columnList = "createdAt")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @NotBlank
    @Column(nullable = false)
    private String category; // e.g., Electronics, Tools, Books, Outdoors, Party & Events

    private String imageUrl;

    private String location;
    private Double latitude;
    private Double longitude;

    @Builder.Default
    private Double dailyRate = 0.0; // ₹ per day (0.0 = Free)

    @Builder.Default
    private Double securityDeposit = 0.0; // ₹ upfront advance caution deposit (0.0 = None)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ItemStatus status = ItemStatus.AVAILABLE;

    // The user who owns/listed this item
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User owner;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
