package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatus;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        AccountType accountType,
        String accountNumber,
        AccountStatus status,
        BigDecimal balance,
        BigDecimal overdraftLimit,
        BigDecimal availableBalance,
        boolean gmfExempt,
        Long customerId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
