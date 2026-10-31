package com.pruebatecnica.entidadfinanciera.domain.model;

import java.math.BigDecimal;

/**
 * Data a worker enters to open an account. A null overdraft limit means $0.
 */
public record OpenAccountData(
        Long customerId,
        AccountType accountType,
        BigDecimal overdraftLimit,
        boolean gmfExempt) {
}
