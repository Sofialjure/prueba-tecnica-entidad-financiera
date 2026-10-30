package com.pruebatecnica.entidadfinanciera.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.pruebatecnica.entidadfinanciera.TestcontainersConfiguration;
import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.CustomerData;
import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import java.time.Clock;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs the persistence adapter against a real PostgreSQL with the Flyway schema and seed data.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class CustomerPersistenceAdapterTest {

    @Autowired
    private CustomerRepositoryPort repository;

    @Test
    void savesAndReadsCustomer() {
        Customer saved = repository.save(Customer.create(new CustomerData(IdentificationType.PA, "AB123456",
                "John", "Smith", "john.smith@correo.com", LocalDate.of(1985, 6, 1)), Clock.systemDefaultZone()));

        assertThat(saved.getId()).isNotNull();
        Customer found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getIdentificationType()).isEqualTo(IdentificationType.PA);
        assertThat(found.getFirstName()).isEqualTo("John");
        assertThat(found.getCreatedAt()).isEqualTo(saved.getCreatedAt());
    }

    @Test
    void findAllReturnsSeedCustomersOrderedById() {
        assertThat(repository.findAll())
                .extracting(Customer::getIdentificationNumber)
                .containsExactly("1020304050", "79845123", "456789");
    }

    @Test
    void checksIdentificationUniqueness() {
        Long anaId = repository.findAll().getFirst().getId();

        assertThat(repository.existsByIdentification(IdentificationType.CC, "1020304050")).isTrue();
        assertThat(repository.existsByIdentification(IdentificationType.CE, "1020304050")).isFalse();
        assertThat(repository.existsByIdentificationExcludingId(IdentificationType.CC, "1020304050", anaId)).isFalse();
        assertThat(repository.existsByIdentificationExcludingId(IdentificationType.CC, "79845123", anaId)).isTrue();
    }

    @Test
    void detectsCustomersWithAccounts() {
        Customer withAccounts = repository.findAll().getFirst();
        Customer withoutAccounts = repository.save(Customer.create(new CustomerData(IdentificationType.CC, "5555555",
                "Sin", "Cuentas", "sin.cuentas@correo.com", LocalDate.of(1980, 1, 1)), Clock.systemDefaultZone()));

        assertThat(repository.hasAccounts(withAccounts.getId())).isTrue();
        assertThat(repository.hasAccounts(withoutAccounts.getId())).isFalse();
    }

    @Test
    void deletesCustomer() {
        Customer customer = repository.save(Customer.create(new CustomerData(IdentificationType.CC, "6666666",
                "Para", "Borrar", "borrar@correo.com", LocalDate.of(1980, 1, 1)), Clock.systemDefaultZone()));

        repository.deleteById(customer.getId());

        assertThat(repository.findById(customer.getId())).isEmpty();
    }
}
