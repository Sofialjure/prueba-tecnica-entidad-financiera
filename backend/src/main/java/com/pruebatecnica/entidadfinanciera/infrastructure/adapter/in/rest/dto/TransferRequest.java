package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import static com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.MovementRequest.ACCOUNT_NUMBER_MESSAGE;
import static com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.MovementRequest.ACCOUNT_NUMBER_REGEX;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Schema(description = "Transferencia entre dos cuentas")
public record TransferRequest(

        @Schema(description = "Cuenta que envía", example = "5300000001")
        @NotBlank(message = "La cuenta de origen es obligatoria")
        @Pattern(regexp = ACCOUNT_NUMBER_REGEX, message = ACCOUNT_NUMBER_MESSAGE)
        String sourceAccountNumber,

        @Schema(description = "Cuenta que recibe", example = "3300000001")
        @NotBlank(message = "La cuenta de destino es obligatoria")
        @Pattern(regexp = ACCOUNT_NUMBER_REGEX, message = ACCOUNT_NUMBER_MESSAGE)
        String targetAccountNumber,

        @Schema(example = "100000.00")
        @NotNull(message = "El monto es obligatorio")
        @Positive(message = "El monto debe ser mayor a $0")
        @Digits(integer = 17, fraction = 2, message = "El monto admite máximo 2 decimales")
        BigDecimal amount,

        @Schema(description = "Opcional", example = "Pago arriendo")
        @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
        String description) {
}
