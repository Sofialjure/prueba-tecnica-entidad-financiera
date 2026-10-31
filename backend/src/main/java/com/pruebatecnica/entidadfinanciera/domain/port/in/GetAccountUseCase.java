package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import java.util.List;

public interface GetAccountUseCase {

    Account getById(Long id);

    List<Account> getAll();

    List<Account> getByCustomerId(Long customerId);
}
