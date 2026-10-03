package com.shareit.controller;

import com.shareit.dto.MessageRequestDto;
import com.shareit.dto.MessageResponseDto;
import com.shareit.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/request/{requestId}")
    public ResponseEntity<MessageResponseDto> sendMessage(
            @PathVariable Long requestId,
            @Valid @RequestBody MessageRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return new ResponseEntity<>(
                messageService.sendMessage(requestId, dto, userDetails.getUsername()),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<MessageResponseDto>> getMessages(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                messageService.getMessagesByRequest(requestId, userDetails.getUsername())
        );
    }
}
