package com.pruebatecnica.entidadfinanciera.domain.model;

/**
 * What originated a movement. GMF is the 4x1000 tax charged as a separate movement (SUP-10).
 */
public enum TransactionType {
    DEPOSIT,
    WITHDRAWAL,
    TRANSFER,
    GMF
}
