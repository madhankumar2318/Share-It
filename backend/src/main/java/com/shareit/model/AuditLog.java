package com.shareit.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_entity", columnList = "entityType, entityId"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String action; // e.g., REQUEST_CREATED, REQUEST_ACCEPTED, HANDOVER_VERIFIED, RETURN_VERIFIED, PIN_LOCKOUT

    @Column(nullable = false, length = 64)
    private String entityType; // e.g., BorrowRequest, Item

    @Column(nullable = false)
    private Long entityId;

    @Column(length = 120)
    private String performedByEmail;

    @Column(length = 2000)
    private String details;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
