package com.pruebatecnica.entidadfinanciera.domain.model;

import java.math.BigDecimal;

/**
 * A deposit or withdrawal requested on one account. The description is optional.
 */
public record MovementData(
        String accountNumber,
        BigDecimal amount,
        String description) {
}
