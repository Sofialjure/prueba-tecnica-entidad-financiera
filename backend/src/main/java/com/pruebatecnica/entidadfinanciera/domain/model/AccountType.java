package com.pruebatecnica.entidadfinanciera.domain.model;

/**
 * The only two account types the entity offers (RF-09), each with its own rules.
 */
public enum AccountType {
    SAVINGS(new SavingsAccountPolicy()),
    CHECKING(new CheckingAccountPolicy());

    private final AccountTypePolicy policy;

    AccountType(AccountTypePolicy policy) {
        this.policy = policy;
    }

    public AccountTypePolicy policy() {
        return policy;
    }
}
