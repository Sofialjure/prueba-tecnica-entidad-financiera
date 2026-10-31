package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatement;

public interface GetAccountStatementUseCase {

    AccountStatement getStatement(Long accountId);
}
