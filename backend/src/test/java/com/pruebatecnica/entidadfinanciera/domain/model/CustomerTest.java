package com.pruebatecnica.entidadfinanciera.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CustomerTest {

    private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");
    /** 2026-10-30 10:00 in Bogotá. */
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), BOGOTA);
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 30);

    @Test
    void createSetsCreationAndModificationDatesAutomatically() {
        Customer customer = Customer.create(validData(), CLOCK);

        LocalDateTime now = LocalDateTime.of(2026, 10, 30, 10, 0);
        assertThat(customer.getCreatedAt()).isEqualTo(now);
        assertThat(customer.getUpdatedAt()).isEqualTo(now);
        assertThat(customer.getId()).isNull();
    }

    @Test
    void createNormalizesNamesAndEmail() {
        CustomerData data = new CustomerData(IdentificationType.CC, " 1020304050 ", "  Ana María ", " Gómez ",
                " Ana.Gomez@Correo.COM ", LocalDate.of(1995, 4, 12));

        Customer customer = Customer.create(data, CLOCK);

        assertThat(customer.getIdentificationNumber()).isEqualTo("1020304050");
        assertThat(customer.getFirstName()).isEqualTo("Ana María");
        assertThat(customer.getLastName()).isEqualTo("Gómez");
        assertThat(customer.getEmail()).isEqualTo("ana.gomez@correo.com");
    }

    @Test
    void acceptsCustomerWhoTurns18Today() {
        Customer customer = Customer.create(withBirthDate(TODAY.minusYears(18)), CLOCK);

        assertThat(customer.getBirthDate()).isEqualTo(LocalDate.of(2008, 10, 30));
    }

    @Test
    void rejectsCustomerWhoTurns18Tomorrow() {
        CustomerData underage = withBirthDate(TODAY.minusYears(18).plusDays(1));

        assertThatThrownBy(() -> Customer.create(underage, CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("mayor de edad");
    }

    @Test
    void rejectsFirstNameShorterThanTwoCharacters() {
        CustomerData data = new CustomerData(IdentificationType.CC, "1020304050", " A ", "Gómez",
                "ana@correo.com", LocalDate.of(1995, 4, 12));

        assertThatThrownBy(() -> Customer.create(data, CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("El campo nombres debe tener al menos 2 caracteres");
    }

    @Test
    void rejectsLastNameShorterThanTwoCharacters() {
        CustomerData data = new CustomerData(IdentificationType.CC, "1020304050", "Ana", "G",
                "ana@correo.com", LocalDate.of(1995, 4, 12));

        assertThatThrownBy(() -> Customer.create(data, CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("El campo apellido debe tener al menos 2 caracteres");
    }

    @ParameterizedTest
    @ValueSource(strings = {"ana", "ana@correo", "@correo.com", "ana@.com", "ana gomez@correo.com", "ana@correo.c"})
    void rejectsInvalidEmail(String email) {
        CustomerData data = new CustomerData(IdentificationType.CC, "1020304050", "Ana", "Gómez",
                email, LocalDate.of(1995, 4, 12));

        assertThatThrownBy(() -> Customer.create(data, CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("correo");
    }

    @Test
    void updateChangesDataAndModificationDateButKeepsCreationDate() {
        Customer customer = Customer.create(validData(), CLOCK);
        Clock later = Clock.offset(CLOCK, java.time.Duration.ofDays(3));
        CustomerData newData = new CustomerData(IdentificationType.CC, "1020304050", "Ana Lucía", "Gómez",
                "ana.lucia@correo.com", LocalDate.of(1995, 4, 12));

        customer.update(newData, later);

        assertThat(customer.getFirstName()).isEqualTo("Ana Lucía");
        assertThat(customer.getEmail()).isEqualTo("ana.lucia@correo.com");
        assertThat(customer.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 10, 30, 10, 0));
        assertThat(customer.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 11, 2, 10, 0));
    }

    @Test
    void updateAppliesTheSameRules() {
        Customer customer = Customer.create(validData(), CLOCK);

        assertThatThrownBy(() -> customer.update(withBirthDate(TODAY.minusYears(10)), CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThat(customer.getBirthDate()).isEqualTo(LocalDate.of(1995, 4, 12));
    }

    private static CustomerData validData() {
        return withBirthDate(LocalDate.of(1995, 4, 12));
    }

    private static CustomerData withBirthDate(LocalDate birthDate) {
        return new CustomerData(IdentificationType.CC, "1020304050", "Ana María", "Gómez",
                "ana.gomez@correo.com", birthDate);
    }
}
