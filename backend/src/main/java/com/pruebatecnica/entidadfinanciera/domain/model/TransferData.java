package com.pruebatecnica.entidadfinanciera.domain.model;

import java.math.BigDecimal;

/**
 * A transfer between two accounts. The description is optional.
 */
public record TransferData(
        String sourceAccountNumber,
        String targetAccountNumber,
        BigDecimal amount,
        String description) {
}
