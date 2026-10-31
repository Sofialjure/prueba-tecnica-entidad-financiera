package com.pruebatecnica.entidadfinanciera.domain.model;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.math.BigDecimal;

/**
 * Savings accounts start with 53, have no overdraft and never go below $0 (RF-12, RF-14).
 */
public class SavingsAccountPolicy implements AccountTypePolicy {

    @Override
    public String numberPrefix() {
        return "53";
    }

    @Override
    public void validateOverdraftLimit(BigDecimal overdraftLimit) {
        if (overdraftLimit.signum() != 0) {
            throw new BusinessRuleViolationException("La cuenta de ahorros no admite cupo de sobregiro");
        }
    }

    @Override
    public BigDecimal minimumBalance(BigDecimal overdraftLimit) {
        return BigDecimal.ZERO;
    }
}
