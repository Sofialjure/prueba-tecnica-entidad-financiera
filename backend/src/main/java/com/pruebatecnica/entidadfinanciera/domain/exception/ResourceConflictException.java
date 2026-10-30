package com.pruebatecnica.entidadfinanciera.domain.exception;

/**
 * The operation conflicts with existing data, e.g. a duplicated identification
 * or deleting a customer that still has accounts.
 */
public class ResourceConflictException extends DomainException {

    public ResourceConflictException(String message) {
        super(message);
    }
}
