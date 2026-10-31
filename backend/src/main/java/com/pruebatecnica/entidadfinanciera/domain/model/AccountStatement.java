package com.pruebatecnica.entidadfinanciera.domain.model;

import java.util.List;

/**
 * Current state of an account with its movements, newest first (RF-24).
 */
public record AccountStatement(Account account, List<Transaction> transactions) {
}
