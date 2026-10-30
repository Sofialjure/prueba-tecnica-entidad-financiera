package com.pruebatecnica.entidadfinanciera.domain.exception;

/**
 * A business rule rejects the operation, e.g. an underage customer,
 * insufficient funds or a transaction on an inactive account.
 */
public class BusinessRuleViolationException extends DomainException {

    public BusinessRuleViolationException(String message) {
        super(message);
    }
}
