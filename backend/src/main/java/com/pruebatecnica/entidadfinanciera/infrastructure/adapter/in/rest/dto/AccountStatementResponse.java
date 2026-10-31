package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import java.util.List;

public record AccountStatementResponse(AccountResponse account, List<TransactionResponse> transactions) {
}
