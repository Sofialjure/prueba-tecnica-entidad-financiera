package com.pruebatecnica.entidadfinanciera.domain.exception;

/**
 * The requested customer or account does not exist.
 */
public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
