package com.pruebatecnica.entidadfinanciera.domain.port.out;

import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;

/**
 * Hands out consecutive numbers per account type; the database guarantees they never repeat,
 * even with concurrent requests.
 */
public interface AccountNumberSequencePort {

    long nextValue(AccountType accountType);
}
