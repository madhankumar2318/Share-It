package com.shareit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponseDto {
    private Long id;
    private Long requestId;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String content;
    private LocalDateTime sentAt;
}
