package com.pruebatecnica.entidadfinanciera.domain.port.out;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import java.util.List;
import java.util.Optional;

public interface AccountRepositoryPort {

    Account save(Account account);

    Optional<Account> findById(Long id);

    List<Account> findAll();

    List<Account> findByCustomerId(Long customerId);
}
