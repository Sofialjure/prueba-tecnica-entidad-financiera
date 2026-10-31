package com.pruebatecnica.entidadfinanciera.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceConflictException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.CustomerData;
import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), ZoneId.of("America/Bogota"));

    @Mock
    private CustomerRepositoryPort repository;

    private CustomerService service;

    @BeforeEach
    void setUp() {
        service = new CustomerService(repository, CLOCK);
    }

    @Test
    void createSavesNewCustomer() {
        when(repository.existsByIdentification(IdentificationType.CC, "1020304050")).thenReturn(false);
        when(repository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Customer created = service.create(data("1020304050", LocalDate.of(1995, 4, 12)));

        assertThat(created.getFirstName()).isEqualTo("Ana María");
        assertThat(created.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 10, 30, 10, 0));
        verify(repository).save(created);
    }

    @Test
    void createRejectsDuplicatedIdentification() {
        when(repository.existsByIdentification(IdentificationType.CC, "1020304050")).thenReturn(true);

        assertThatThrownBy(() -> service.create(data(" 1020304050 ", LocalDate.of(1995, 4, 12))))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessage("Ya existe un cliente con identificación CC 1020304050");
        verify(repository, never()).save(any());
    }

    @Test
    void createRejectsUnderageCustomerWithoutSaving() {
        when(repository.existsByIdentification(IdentificationType.CC, "1020304050")).thenReturn(false);

        assertThatThrownBy(() -> service.create(data("1020304050", LocalDate.of(2010, 1, 1))))
                .isInstanceOf(BusinessRuleViolationException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void getByIdReturnsCustomer() {
        Customer stored = storedCustomer(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(stored));

        assertThat(service.getById(1L)).isSameAs(stored);
    }

    @Test
    void getByIdFailsWhenCustomerDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe el cliente con id 99");
    }

    @Test
    void getAllReturnsEveryCustomer() {
        List<Customer> customers = List.of(storedCustomer(1L), storedCustomer(2L));
        when(repository.findAll()).thenReturn(customers);

        assertThat(service.getAll()).isEqualTo(customers);
    }

    @Test
    void updateChangesDataAndModificationDate() {
        when(repository.findById(1L)).thenReturn(Optional.of(storedCustomer(1L)));
        when(repository.existsByIdentificationExcludingId(IdentificationType.CC, "1020304050", 1L)).thenReturn(false);
        when(repository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Customer updated = service.update(1L, data("1020304050", LocalDate.of(1995, 4, 12)));

        assertThat(updated.getId()).isEqualTo(1L);
        assertThat(updated.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 10, 1, 8, 0));
        assertThat(updated.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 10, 30, 10, 0));
    }

    @Test
    void updateRejectsIdentificationOfAnotherCustomer() {
        when(repository.findById(1L)).thenReturn(Optional.of(storedCustomer(1L)));
        when(repository.existsByIdentificationExcludingId(IdentificationType.CC, "79845123", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.update(1L, data("79845123", LocalDate.of(1995, 4, 12))))
                .isInstanceOf(ResourceConflictException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void updateFailsWhenCustomerDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, data("1020304050", LocalDate.of(1995, 4, 12))))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRemovesCustomerWithoutAccounts() {
        when(repository.findById(1L)).thenReturn(Optional.of(storedCustomer(1L)));
        when(repository.hasAccounts(1L)).thenReturn(false);

        service.delete(1L);

        verify(repository).deleteById(1L);
    }

    @Test
    void deleteRejectsCustomerWithAccounts() {
        when(repository.findById(1L)).thenReturn(Optional.of(storedCustomer(1L)));
        when(repository.hasAccounts(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("productos vinculados");
        verify(repository, never()).deleteById(any());
    }

    @Test
    void deleteFailsWhenCustomerDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(99L)).isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    private static CustomerData data(String identificationNumber, LocalDate birthDate) {
        return new CustomerData(IdentificationType.CC, identificationNumber, "Ana María", "Gómez",
                "ana.gomez@correo.com", birthDate);
    }

    private static Customer storedCustomer(Long id) {
        return Customer.builder()
                .id(id)
                .identificationType(IdentificationType.CC)
                .identificationNumber("1020304050")
                .firstName("Ana")
                .lastName("Gómez")
                .email("ana@correo.com")
                .birthDate(LocalDate.of(1995, 4, 12))
                .createdAt(LocalDateTime.of(2026, 10, 1, 8, 0))
                .updatedAt(LocalDateTime.of(2026, 10, 1, 8, 0))
                .build();
    }
}
