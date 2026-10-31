package com.pruebatecnica.entidadfinanciera.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.pruebatecnica.entidadfinanciera.TestcontainersConfiguration;
import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.MovementData;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.model.TransferData;
import com.pruebatecnica.entidadfinanciera.domain.port.in.DepositUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountStatementUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.OpenAccountUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.TransferUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.WithdrawUseCase;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Fires simultaneous operations at the real database to prove the pessimistic locks (RNF-10, ADR-0004).
 * Each operation commits, so the accounts created here are removed afterwards to keep the seed data intact.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class TransactionConcurrencyTest {

    private static final int THREADS = 10;
    /**
     * Seed customers without an account of these types, since a customer has at most one
     * active or inactive account of each type (SUP-15).
     */
    private static final long CARLOS = 2L;
    private static final long LAURA = 3L;

    @Autowired
    private OpenAccountUseCase openAccount;
    @Autowired
    private GetAccountUseCase getAccount;
    @Autowired
    private DepositUseCase deposit;
    @Autowired
    private WithdrawUseCase withdraw;
    @Autowired
    private TransferUseCase transfer;
    @Autowired
    private GetAccountStatementUseCase statement;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<Long> createdAccountIds = new ArrayList<>();

    @AfterEach
    void removeCreatedAccounts() {
        for (Long id : createdAccountIds) {
            jdbcTemplate.update("DELETE FROM transactions WHERE account_id = ?", id);
            jdbcTemplate.update("DELETE FROM accounts WHERE id = ?", id);
        }
    }

    @Test
    void simultaneousWithdrawalsNeverSpendMoreThanTheBalance() throws Exception {
        Account account = openWithBalance(CARLOS, AccountType.CHECKING, false, "1000000");

        List<Boolean> results = runConcurrently(THREADS, i -> () ->
                withdraw.withdraw(new MovementData(account.getAccountNumber(), new BigDecimal("100000"), null)));

        // Each withdrawal costs 100,000 + 400 of GMF: only 9 fit in 1,000,000
        assertThat(results).filteredOn(ok -> ok).hasSize(9);
        Account after = getAccount.getById(account.getId());
        assertThat(after.getBalance()).isEqualByComparingTo("96400");
        assertThat(statement.getStatement(account.getId()).transactions()).hasSize(1 + 9 * 2);
        assertThat(statement.getStatement(account.getId()).transactions().getFirst().balanceAfter())
                .isEqualByComparingTo("96400");
    }

    @Test
    void oppositeTransfersAtTheSameTimeDoNotDeadlockNorLoseMoney() throws Exception {
        Account first = openWithBalance(CARLOS, AccountType.CHECKING, true, "500000");
        Account second = openWithBalance(LAURA, AccountType.SAVINGS, true, "500000");

        List<Boolean> results = runConcurrently(THREADS * 2, i -> () -> i % 2 == 0
                ? transfer.transfer(new TransferData(first.getAccountNumber(), second.getAccountNumber(),
                        new BigDecimal("1000"), null))
                : transfer.transfer(new TransferData(second.getAccountNumber(), first.getAccountNumber(),
                        new BigDecimal("3000"), null)));

        assertThat(results).containsOnly(true);
        assertThat(getAccount.getById(first.getId()).getBalance()).isEqualByComparingTo("520000");
        assertThat(getAccount.getById(second.getId()).getBalance()).isEqualByComparingTo("480000");
    }

    private Account openWithBalance(long customerId, AccountType type, boolean gmfExempt, String balance) {
        Account account = openAccount.open(new OpenAccountData(customerId, type, null, gmfExempt));
        createdAccountIds.add(account.getId());
        deposit.deposit(new MovementData(account.getAccountNumber(), new BigDecimal(balance), null));
        return account;
    }

    /** Starts every task at the same instant; true when the operation succeeded, false on a business rule. */
    private static List<Boolean> runConcurrently(int tasks, TaskFactory factory) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(THREADS);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Boolean>> futures = new ArrayList<>();
            for (int i = 0; i < tasks; i++) {
                Callable<?> operation = factory.create(i);
                futures.add(executor.submit(() -> {
                    start.await();
                    try {
                        operation.call();
                        return true;
                    } catch (BusinessRuleViolationException e) {
                        return false;
                    }
                }));
            }
            start.countDown();
            List<Boolean> results = new ArrayList<>();
            for (Future<Boolean> future : futures) {
                results.add(future.get(30, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            executor.shutdownNow();
        }
    }

    @FunctionalInterface
    private interface TaskFactory {
        Callable<?> create(int index);
    }
}
