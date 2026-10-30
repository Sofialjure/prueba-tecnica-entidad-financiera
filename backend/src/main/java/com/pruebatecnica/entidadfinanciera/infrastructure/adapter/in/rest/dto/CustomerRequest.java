package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

@Schema(description = "Datos para crear o actualizar un cliente")
public record CustomerRequest(

        @Schema(description = "CC: cédula de ciudadanía, CE: cédula de extranjería, PA: pasaporte", example = "CC")
        @NotNull(message = "El tipo de identificación es obligatorio")
        IdentificationType identificationType,

        @Schema(example = "1020304050")
        @NotBlank(message = "El número de identificación es obligatorio")
        @Pattern(regexp = "^[A-Za-z0-9]{4,20}$",
                message = "El número de identificación debe tener entre 4 y 20 caracteres alfanuméricos")
        String identificationNumber,

        @Schema(example = "Ana María")
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(min = Customer.MIN_NAME_LENGTH, max = 100, message = "Los nombres deben tener entre 2 y 100 caracteres")
        String firstName,

        @Schema(example = "Gómez")
        @NotBlank(message = "El apellido es obligatorio")
        @Size(min = Customer.MIN_NAME_LENGTH, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres")
        String lastName,

        @Schema(example = "ana.gomez@correo.com")
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Size(max = 150, message = "El correo electrónico no puede superar 150 caracteres")
        @Pattern(regexp = Customer.EMAIL_REGEX, message = "El correo electrónico debe tener el formato xxxx@xxxxx.xxx")
        String email,

        @Schema(example = "1995-04-12")
        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
        LocalDate birthDate) {
}
