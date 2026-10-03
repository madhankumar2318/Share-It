package com.shareit.service;

import com.shareit.dto.MessageRequestDto;
import com.shareit.dto.MessageResponseDto;
import com.shareit.model.BorrowRequest;
import com.shareit.model.Message;
import com.shareit.model.User;
import com.shareit.repository.BorrowRequestRepository;
import com.shareit.repository.MessageRepository;
import com.shareit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final BorrowRequestRepository borrowRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageResponseDto sendMessage(Long requestId, MessageRequestDto dto, String userEmail) {
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Borrow request not found with id: " + requestId));

        // Security check: Only borrower or lender of this request can send messages
        boolean isBorrower = request.getBorrower().getId().equals(sender.getId());
        boolean isOwner = request.getItem().getOwner().getId().equals(sender.getId());

        if (!isBorrower && !isOwner) {
            throw new AccessDeniedException("You are not part of this borrow request conversation");
        }

        Message message = Message.builder()
                .borrowRequest(request)
                .sender(sender)
                .content(dto.getContent().trim())
                .build();

        Message saved = messageRepository.save(message);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MessageResponseDto> getMessagesByRequest(Long requestId, String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BorrowRequest request = borrowRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Borrow request not found with id: " + requestId));

        boolean isBorrower = request.getBorrower().getId().equals(currentUser.getId());
        boolean isOwner = request.getItem().getOwner().getId().equals(currentUser.getId());

        if (!isBorrower && !isOwner) {
            throw new AccessDeniedException("You are not part of this borrow request conversation");
        }

        return messageRepository.findByBorrowRequestIdOrderBySentAtAsc(requestId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private MessageResponseDto mapToDto(Message msg) {
        return MessageResponseDto.builder()
                .id(msg.getId())
                .requestId(msg.getBorrowRequest().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .senderEmail(msg.getSender().getEmail())
                .content(msg.getContent())
                .sentAt(msg.getSentAt())
                .build();
    }
}
