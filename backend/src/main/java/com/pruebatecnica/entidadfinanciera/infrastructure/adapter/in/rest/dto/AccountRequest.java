package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

@Schema(description = "Datos para abrir una cuenta. El número de cuenta, el estado y el saldo se asignan automáticamente")
public record AccountRequest(

        @Schema(description = "Id del cliente propietario", example = "1")
        @NotNull(message = "El cliente es obligatorio")
        @Positive(message = "El id del cliente debe ser positivo")
        Long customerId,

        @Schema(description = "SAVINGS: cuenta de ahorros, CHECKING: cuenta corriente", example = "SAVINGS")
        @NotNull(message = "El tipo de cuenta es obligatorio")
        AccountType accountType,

        @Schema(description = "Cupo de sobregiro; solo aplica a cuenta corriente. Por defecto 0", example = "0")
        @PositiveOrZero(message = "El cupo de sobregiro no puede ser negativo")
        @Digits(integer = 17, fraction = 2, message = "El cupo de sobregiro admite máximo 2 decimales")
        BigDecimal overdraftLimit,

        @Schema(description = "Si la cuenta está exenta del GMF (4x1000). Por defecto false", example = "false")
        Boolean gmfExempt) {
}
