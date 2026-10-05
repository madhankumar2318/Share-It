package com.shareit.controller;

import com.shareit.model.AuditLog;
import com.shareit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getLogs(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return ResponseEntity.ok(auditLogService.getLogsForEntity(entityType, entityId));
    }
}
