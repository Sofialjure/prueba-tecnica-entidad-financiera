package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.TransactionReceipt;
import com.pruebatecnica.entidadfinanciera.domain.model.TransferData;

public interface TransferUseCase {

    TransactionReceipt transfer(TransferData data);
}
