package com.shareit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteAccountRequest {

    @NotBlank(message = "Password confirmation is required")
    @Size(max = 128, message = "Password cannot exceed 128 characters")
    private String password;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;
}
