package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.MovementData;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionReceipt;

public interface WithdrawUseCase {

    TransactionReceipt withdraw(MovementData data);
}
