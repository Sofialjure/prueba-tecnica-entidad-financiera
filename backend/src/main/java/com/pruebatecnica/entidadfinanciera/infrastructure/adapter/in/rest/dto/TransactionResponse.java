package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import com.pruebatecnica.entidadfinanciera.domain.model.EntryType;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponse(
        Long id,
        UUID reference,
        String accountNumber,
        TransactionType type,
        EntryType entryType,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String description,
        LocalDateTime createdAt) {
}
