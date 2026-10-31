package com.pruebatecnica.entidadfinanciera.domain.model;

import java.util.List;
import java.util.UUID;

/**
 * Result of one operation: every movement it generated, in the order they were applied.
 */
public record TransactionReceipt(UUID reference, List<Transaction> entries) {
}
