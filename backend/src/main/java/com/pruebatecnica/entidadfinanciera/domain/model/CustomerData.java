package com.pruebatecnica.entidadfinanciera.domain.model;

import java.time.LocalDate;

/**
 * Personal data a worker can enter or change for a customer.
 */
public record CustomerData(
        IdentificationType identificationType,
        String identificationNumber,
        String firstName,
        String lastName,
        String email,
        LocalDate birthDate) {
}
