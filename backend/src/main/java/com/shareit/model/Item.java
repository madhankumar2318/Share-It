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

    // Toy & Book Rotate Club fields
    @Column(length = 30)
    private String ageGroup; // e.g. "0-2 yrs", "3-5 yrs", "6-8 yrs", "9-12 yrs", "All Ages"

    @Builder.Default
    private Boolean isCleanedSanitized = false; // Verified sanitization badge for toys/baby equipment

    // Seasonal Festival & Event Vault fields
    @Column(length = 50)
    @Builder.Default
    private String seasonalTag = "NONE"; // "NONE", "DIWALI_FESTIVE", "TRAVEL_CAMPING", "PARTY_CELEBRATION", "SUMMER_MONSOON"

    @Builder.Default
    private Boolean seasonalActive = true;

    // Voice Note Care Instructions (Audio Guide)
    @Column(length = 500)
    private String voiceNoteUrl;

    private Integer voiceNoteDuration; // Duration in seconds

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
