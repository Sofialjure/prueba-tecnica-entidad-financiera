package com.pruebatecnica.entidadfinanciera.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.pruebatecnica.entidadfinanciera.TestcontainersConfiguration;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.EntryType;
import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionType;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.TransactionRepositoryPort;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs the persistence adapters against a real PostgreSQL with the Flyway schema and seed data.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class TransactionPersistenceAdapterTest {

    @Autowired
    private TransactionRepositoryPort transactionRepository;
    @Autowired
    private AccountRepositoryPort accountRepository;
    @Autowired
    private EntityManager entityManager;

    @Test
    void findsSeedMovementsNewestFirstWithAccountNumber() {
        Long anaSavingsId = accountRepository.findAll().getFirst().getId();

        assertThat(transactionRepository.findByAccountId(anaSavingsId))
                .extracting(Transaction::accountNumber, Transaction::type, Transaction::amount,
                        Transaction::balanceAfter)
                .containsExactly(
                        tuple("5300000001", TransactionType.GMF, new BigDecimal("800.00"), new BigDecimal("1799200.00")),
                        tuple("5300000001", TransactionType.WITHDRAWAL, new BigDecimal("200000.00"),
                                new BigDecimal("1800000.00")),
                        tuple("5300000001", TransactionType.DEPOSIT, new BigDecimal("2000000.00"),
                                new BigDecimal("2000000.00")));
    }

    @Test
    void savesMovementsOfOneOperation() {
        Account account = accountRepository.findAll().get(2);
        UUID reference = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.of(2026, 10, 30, 10, 0);

        List<Transaction> saved = transactionRepository.saveAll(List.of(new Transaction(null, reference, account.getId(), null,
                TransactionType.DEPOSIT, EntryType.CREDIT, new BigDecimal("1000.00"), new BigDecimal("601000.00"),
                "Consignación", now)));
        assertThat(saved).singleElement().satisfies(movement -> assertThat(movement.id()).isNotNull());
        // Read from the database, not from the persistence context, as a later request would
        entityManager.flush();
        entityManager.clear();

        assertThat(transactionRepository.findByAccountId(account.getId()).getFirst())
                .satisfies(movement -> {
                    assertThat(movement.id()).isEqualTo(saved.getFirst().id());
                    assertThat(movement.reference()).isEqualTo(reference);
                    assertThat(movement.accountNumber()).isEqualTo("5300000002");
                    assertThat(movement.createdAt()).isEqualTo(now);
                });
    }

    @Test
    void locksAccountsInAscendingIdOrderWhateverTheRequestOrder() {
        assertThat(accountRepository.findByAccountNumbersForUpdate(List.of("3300000002", "5300000001", "5399999999")))
                .extracting(Account::getAccountNumber)
                .containsExactly("5300000001", "3300000002");
    }

    @Test
    void locksSingleAccountById() {
        Long id = accountRepository.findAll().getFirst().getId();

        assertThat(accountRepository.findByIdForUpdate(id)).get()
                .extracting(Account::getAccountNumber).isEqualTo("5300000001");
    }
}
