package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;

public interface OpenAccountUseCase {

    Account open(OpenAccountData data);
}
