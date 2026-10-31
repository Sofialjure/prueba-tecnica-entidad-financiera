package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Schema(description = "Consignación o retiro sobre una cuenta")
public record MovementRequest(

        @Schema(example = "5300000001")
        @NotBlank(message = "El número de cuenta es obligatorio")
        @Pattern(regexp = ACCOUNT_NUMBER_REGEX, message = ACCOUNT_NUMBER_MESSAGE)
        String accountNumber,

        @Schema(example = "100000.00")
        @NotNull(message = "El monto es obligatorio")
        @Positive(message = "El monto debe ser mayor a $0")
        @Digits(integer = 17, fraction = 2, message = "El monto admite máximo 2 decimales")
        BigDecimal amount,

        @Schema(description = "Opcional", example = "Pago de nómina")
        @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
        String description) {

    public static final String ACCOUNT_NUMBER_REGEX = "^(53|33)[0-9]{8}$";
    public static final String ACCOUNT_NUMBER_MESSAGE =
            "El número de cuenta debe tener 10 dígitos y empezar por 53 o 33";
}
