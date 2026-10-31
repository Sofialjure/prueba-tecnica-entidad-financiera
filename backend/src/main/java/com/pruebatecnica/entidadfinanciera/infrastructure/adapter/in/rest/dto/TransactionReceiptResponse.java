package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import java.util.List;
import java.util.UUID;

public record TransactionReceiptResponse(UUID reference, List<TransactionResponse> entries) {
}
