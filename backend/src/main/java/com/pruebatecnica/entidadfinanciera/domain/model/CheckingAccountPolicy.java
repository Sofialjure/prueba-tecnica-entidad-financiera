package com.pruebatecnica.entidadfinanciera.domain.model;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.math.BigDecimal;

/**
 * Checking accounts start with 33 and may go negative down to their overdraft limit (RF-12, SUP-01).
 */
public class CheckingAccountPolicy implements AccountTypePolicy {

    @Override
    public String numberPrefix() {
        return "33";
    }

    @Override
    public void validateOverdraftLimit(BigDecimal overdraftLimit) {
        if (overdraftLimit.signum() < 0) {
            throw new BusinessRuleViolationException("El cupo de sobregiro no puede ser negativo");
        }
    }

    @Override
    public BigDecimal minimumBalance(BigDecimal overdraftLimit) {
        return overdraftLimit.negate();
    }
}
