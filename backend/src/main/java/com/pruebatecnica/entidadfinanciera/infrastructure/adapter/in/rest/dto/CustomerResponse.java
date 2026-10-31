package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        IdentificationType identificationType,
        String identificationNumber,
        String firstName,
        String lastName,
        String email,
        LocalDate birthDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
