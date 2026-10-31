package com.pruebatecnica.entidadfinanciera.domain.model;

import java.math.BigDecimal;

/**
 * Strategy with the rules that change with the account type, so the rest of the code
 * does not need to ask which type an account is.
 */
public interface AccountTypePolicy {

    /** First two digits of the account number (RF-12). */
    String numberPrefix();

    /** Rejects an overdraft limit the account type does not allow (SUP-01). */
    void validateOverdraftLimit(BigDecimal overdraftLimit);

    /** Lowest balance the account may reach (RF-14, SUP-01). */
    BigDecimal minimumBalance(BigDecimal overdraftLimit);
}
