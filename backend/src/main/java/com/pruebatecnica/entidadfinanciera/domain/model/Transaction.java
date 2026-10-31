package com.pruebatecnica.entidadfinanciera.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One movement on one account. Movements are immutable (SUP-13): an error is fixed with a new
 * movement in the opposite direction. All movements of one operation share the same reference.
 *
 * @param balanceAfter account balance right after this movement, used by the statement
 */
public record Transaction(
        Long id,
        UUID reference,
        Long accountId,
        String accountNumber,
        TransactionType type,
        EntryType entryType,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String description,
        LocalDateTime createdAt) {
}
