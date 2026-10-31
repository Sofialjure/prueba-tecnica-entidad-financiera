package com.pruebatecnica.entidadfinanciera.domain.model;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * A customer of the financial entity.
 * New customers are built with {@link #create}, which applies every business rule;
 * {@link #builder()} only rebuilds customers that were already stored.
 */
public class Customer {

    public static final int LEGAL_AGE = 18;
    public static final int MIN_NAME_LENGTH = 2;
    /** Format xxxx@xxxxx.xxx (RF-07). */
    public static final String EMAIL_REGEX = "^[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}$";

    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    private Long id;
    private IdentificationType identificationType;
    private String identificationNumber;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate birthDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Customer() {
    }

    /** Registers a new customer; creation and modification dates are set automatically (RF-06). */
    public static Customer create(CustomerData data, Clock clock) {
        Customer customer = new Customer();
        customer.applyData(data, clock);
        customer.createdAt = customer.updatedAt;
        return customer;
    }

    /** Changes the personal data and refreshes the modification date (RF-03). */
    public void update(CustomerData data, Clock clock) {
        applyData(data, clock);
    }

    private void applyData(CustomerData data, Clock clock) {
        String normalizedFirstName = data.firstName().strip();
        String normalizedLastName = data.lastName().strip();
        String normalizedEmail = data.email().strip().toLowerCase(Locale.ROOT);

        validateLegalAge(data.birthDate(), LocalDate.now(clock));
        validateNameLength(normalizedFirstName, "nombres");
        validateNameLength(normalizedLastName, "apellido");
        validateEmail(normalizedEmail);

        this.identificationType = data.identificationType();
        this.identificationNumber = data.identificationNumber().strip();
        this.firstName = normalizedFirstName;
        this.lastName = normalizedLastName;
        this.email = normalizedEmail;
        this.birthDate = data.birthDate();
        this.updatedAt = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
    }

    private static void validateLegalAge(LocalDate birthDate, LocalDate today) {
        if (birthDate.plusYears(LEGAL_AGE).isAfter(today)) {
            throw new BusinessRuleViolationException(
                    "El cliente debe ser mayor de edad (" + LEGAL_AGE + " años cumplidos)");
        }
    }

    private static void validateNameLength(String value, String field) {
        if (value.length() < MIN_NAME_LENGTH) {
            throw new BusinessRuleViolationException(
                    "El campo " + field + " debe tener al menos " + MIN_NAME_LENGTH + " caracteres");
        }
    }

    private static void validateEmail(String email) {
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new BusinessRuleViolationException("El correo electrónico no tiene un formato válido");
        }
    }

    public Long getId() {
        return id;
    }

    public IdentificationType getIdentificationType() {
        return identificationType;
    }

    public String getIdentificationNumber() {
        return identificationNumber;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    /** Rebuilds a stored customer without re-running the creation rules. */
    public static final class Builder {

        private final Customer customer = new Customer();

        private Builder() {
        }

        public Builder id(Long id) {
            customer.id = id;
            return this;
        }

        public Builder identificationType(IdentificationType identificationType) {
            customer.identificationType = identificationType;
            return this;
        }

        public Builder identificationNumber(String identificationNumber) {
            customer.identificationNumber = identificationNumber;
            return this;
        }

        public Builder firstName(String firstName) {
            customer.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            customer.lastName = lastName;
            return this;
        }

        public Builder email(String email) {
            customer.email = email;
            return this;
        }

        public Builder birthDate(LocalDate birthDate) {
            customer.birthDate = birthDate;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            customer.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            customer.updatedAt = updatedAt;
            return this;
        }

        public Customer build() {
            return customer;
        }
    }
}
