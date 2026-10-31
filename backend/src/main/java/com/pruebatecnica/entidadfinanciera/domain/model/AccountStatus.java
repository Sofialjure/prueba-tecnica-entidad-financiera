package com.pruebatecnica.entidadfinanciera.domain.model;

/**
 * Lifecycle of an account (SUP-04): INACTIVE can go back to ACTIVE, CANCELLED is final.
 */
public enum AccountStatus {
    ACTIVE,
    INACTIVE,
    CANCELLED
}
