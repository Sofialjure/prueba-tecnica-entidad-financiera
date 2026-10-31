package com.pruebatecnica.entidadfinanciera.domain.port.out;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AccountRepositoryPort {

    Account save(Account account);

    Optional<Account> findById(Long id);

    /**
     * Reads the account and locks it until the transaction ends, so concurrent changes
     * to the same account wait for each other (RNF-10).
     */
    Optional<Account> findByIdForUpdate(Long id);

    /**
     * Locks the accounts with the given numbers in ascending id order, whatever order the numbers
     * come in, so two opposite transfers can never deadlock (ADR-0004). Missing numbers are skipped.
     */
    List<Account> findByAccountNumbersForUpdate(Collection<String> accountNumbers);

    List<Account> findAll();

    List<Account> findByCustomerId(Long customerId);
}
