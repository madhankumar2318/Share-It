package com.shareit.service;

import com.shareit.model.AuditLog;
import com.shareit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, Long entityId, String performedByEmail, String details) {
        try {
            AuditLog record = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .performedByEmail(performedByEmail)
                    .details(details)
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(record);
            log.info("AUDIT: [{}] on {}#{} by {}: {}", action, entityType, entityId, performedByEmail, details);
        } catch (Exception e) {
            log.error("Failed to write audit log for action: {}", action, e);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getLogsForEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }
}
