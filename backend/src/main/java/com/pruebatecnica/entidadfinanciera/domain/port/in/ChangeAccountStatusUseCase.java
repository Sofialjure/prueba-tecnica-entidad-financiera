package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;

public interface ChangeAccountStatusUseCase {

    Account activate(Long id);

    Account deactivate(Long id);

    Account cancel(Long id);
}
