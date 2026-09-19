package com.oceancool.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank(message = "Customer name is required")
        @Size(max = 150, message = "Customer name is too long")
        String name,

        @Size(max = 20, message = "Phone number is too long")
        @Pattern(regexp = "^$|^[0-9+\\-\\s]{6,20}$", message = "Enter a valid phone number")
        String phoneNumber,

        @Size(max = 400, message = "Address is too long")
        String address
) {
}
