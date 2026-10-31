package com.pruebatecnica.entidadfinanciera.domain.port.out;

import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import java.util.List;

/**
 * Movements are only inserted and read, never updated or deleted (SUP-13).
 */
public interface TransactionRepositoryPort {

    /** Returns the movements, in the same order, with their generated ids. */
    List<Transaction> saveAll(List<Transaction> transactions);

    /** Newest movement first. */
    List<Transaction> findByAccountId(Long accountId);
}
