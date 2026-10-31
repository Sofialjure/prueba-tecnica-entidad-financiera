package com.pruebatecnica.entidadfinanciera.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.pruebatecnica.entidadfinanciera.TestcontainersConfiguration;
import com.pruebatecnica.entidadfinanciera.application.service.AccountFactory;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatus;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountNumberSequencePort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import java.math.BigDecimal;
import java.time.Clock;
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
class AccountPersistenceAdapterTest {

    @Autowired
    private AccountRepositoryPort repository;
    @Autowired
    private AccountNumberSequencePort numberSequence;
    @Autowired
    private AccountFactory factory;
    @Autowired
    private CustomerRepositoryPort customerRepository;

    @Test
    void findAllReturnsSeedAccountsWithBalances() {
        assertThat(repository.findAll())
                .extracting(Account::getAccountNumber, Account::getStatus, Account::getBalance)
                .containsExactly(
                        tuple("5300000001", AccountStatus.ACTIVE, new BigDecimal("1799200.00")),
                        tuple("3300000001", AccountStatus.ACTIVE, new BigDecimal("899600.00")),
                        tuple("5300000002", AccountStatus.ACTIVE, new BigDecimal("600000.00")),
                        tuple("3300000002", AccountStatus.INACTIVE, new BigDecimal("0.00")));
    }

    @Test
    void readsCheckingAccountWithOverdraftAndAvailableBalance() {
        Account checking = repository.findAll().get(1);

        assertThat(checking.getAccountType()).isEqualTo(AccountType.CHECKING);
        assertThat(checking.getOverdraftLimit()).isEqualByComparingTo("500000");
        assertThat(checking.getAvailableBalance()).isEqualByComparingTo("1399600");
    }

    @Test
    void sequencesContinueAfterSeedNumbers() {
        long savings = numberSequence.nextValue(AccountType.SAVINGS);
        long checking = numberSequence.nextValue(AccountType.CHECKING);

        assertThat(numberSequence.nextValue(AccountType.SAVINGS)).isEqualTo(savings + 1);
        assertThat(numberSequence.nextValue(AccountType.CHECKING)).isEqualTo(checking + 1);
        assertThat(savings).isGreaterThanOrEqualTo(3);
        assertThat(checking).isGreaterThanOrEqualTo(3);
    }

    @Test
    void savesNewAccountAndFindsItByCustomer() {
        Long customerId = customerRepository.findAll().get(2).getId();

        Account saved = repository.save(factory.open(
                new OpenAccountData(customerId, AccountType.CHECKING, new BigDecimal("250000"), true)));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getAccountNumber()).startsWith("33").hasSize(10);
        assertThat(repository.findByCustomerId(customerId))
                .extracting(Account::getAccountNumber)
                .containsExactly("3300000002", saved.getAccountNumber());
        Account found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.isGmfExempt()).isTrue();
        assertThat(found.getCreatedAt()).isEqualTo(saved.getCreatedAt());
    }

    @Test
    void updatesAccountStatus() {
        Account inactive = repository.findAll().get(3);

        inactive.cancel(Clock.systemDefaultZone());
        repository.save(inactive);

        assertThat(repository.findById(inactive.getId()).orElseThrow().getStatus())
                .isEqualTo(AccountStatus.CANCELLED);
    }
}
