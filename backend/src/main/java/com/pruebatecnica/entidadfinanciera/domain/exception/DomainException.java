package com.pruebatecnica.entidadfinanciera.domain.exception;

/**
 * Base type for every error raised by the business core.
 * Messages are user-facing, so they are written in Spanish.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }
}
