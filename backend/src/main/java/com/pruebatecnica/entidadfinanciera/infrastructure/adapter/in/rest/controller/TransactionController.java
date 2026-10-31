package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.controller;

import com.pruebatecnica.entidadfinanciera.domain.port.in.DepositUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountStatementUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.TransferUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.WithdrawUseCase;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.AccountStatementResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.MovementRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.TransactionReceiptResponse;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.TransferRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper.TransactionRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Movements can only be created and read; there are no endpoints to edit or delete them (SUP-13).
 */
@Tag(name = "Transacciones", description = "Consignaciones, retiros, transferencias y estado de cuenta")
@RestController
@RequestMapping("/api/v1")
public class TransactionController {

    private final DepositUseCase deposit;
    private final WithdrawUseCase withdraw;
    private final TransferUseCase transfer;
    private final GetAccountStatementUseCase statement;
    private final TransactionRestMapper mapper;

    public TransactionController(DepositUseCase deposit, WithdrawUseCase withdraw, TransferUseCase transfer,
            GetAccountStatementUseCase statement, TransactionRestMapper mapper) {
        this.deposit = deposit;
        this.withdraw = withdraw;
        this.transfer = transfer;
        this.statement = statement;
        this.mapper = mapper;
    }

    @Operation(summary = "Consignar", description = "Movimiento crédito sobre una cuenta activa")
    @PostMapping("/transactions/deposits")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionReceiptResponse deposit(@Valid @RequestBody MovementRequest request) {
        return mapper.toResponse(deposit.deposit(mapper.toData(request)));
    }

    @Operation(summary = "Retirar",
            description = "Movimiento débito. En cuentas no exentas se cobra además el GMF (4x1000) como otro movimiento")
    @PostMapping("/transactions/withdrawals")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionReceiptResponse withdraw(@Valid @RequestBody MovementRequest request) {
        return mapper.toResponse(withdraw.withdraw(mapper.toData(request)));
    }

    @Operation(summary = "Transferir",
            description = "Débito en la cuenta de origen (más el GMF si no es exenta) y crédito en la de destino")
    @PostMapping("/transactions/transfers")
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionReceiptResponse transfer(@Valid @RequestBody TransferRequest request) {
        return mapper.toResponse(transfer.transfer(mapper.toData(request)));
    }

    @Operation(summary = "Estado de cuenta", description = "Datos de la cuenta y sus movimientos, del más reciente al más antiguo")
    @GetMapping("/accounts/{id}/transactions")
    public AccountStatementResponse statement(@PathVariable Long id) {
        return mapper.toResponse(statement.getStatement(id));
    }
}
