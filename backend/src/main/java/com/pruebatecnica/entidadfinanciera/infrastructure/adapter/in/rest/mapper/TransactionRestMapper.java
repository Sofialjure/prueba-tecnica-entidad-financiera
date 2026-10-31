package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper;

import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatement;
import com.pruebatecnica.entidadfinanciera.domain.model.MovementData;
import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionReceipt;
import com.pruebatecnica.entidadfinanciera.domain.model.TransferData;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.AccountStatementResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.MovementRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.TransactionReceiptResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.TransactionResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.TransferRequest;
import org.mapstruct.Mapper;

@Mapper(uses = AccountRestMapper.class)
public interface TransactionRestMapper {

    MovementData toData(MovementRequest request);

    TransferData toData(TransferRequest request);

    TransactionResponse toResponse(Transaction transaction);

    TransactionReceiptResponse toResponse(TransactionReceipt receipt);

    AccountStatementResponse toResponse(AccountStatement statement);
}
