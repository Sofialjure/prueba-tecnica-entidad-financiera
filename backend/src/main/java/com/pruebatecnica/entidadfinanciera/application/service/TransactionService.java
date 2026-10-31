package com.pruebatecnica.entidadfinanciera.application.service;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatement;
import com.pruebatecnica.entidadfinanciera.domain.model.MovementData;
import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionReceipt;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionType;
import com.pruebatecnica.entidadfinanciera.domain.model.TransferData;
import com.pruebatecnica.entidadfinanciera.domain.port.in.DepositUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountStatementUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.TransferUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.WithdrawUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.TransactionRepositoryPort;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Each operation runs in one database transaction: balances and movements are saved together
 * or not at all, and the accounts involved stay locked until it ends (ACID, ADR-0004).
 */
@Service
@Transactional
public class TransactionService
        implements DepositUseCase, WithdrawUseCase, TransferUseCase, GetAccountStatementUseCase {

    private final AccountRepositoryPort accountRepository;
    private final TransactionRepositoryPort transactionRepository;
    private final Clock clock;

    public TransactionService(AccountRepositoryPort accountRepository,
            TransactionRepositoryPort transactionRepository, Clock clock) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.clock = clock;
    }

    @Override
    public TransactionReceipt deposit(MovementData data) {
        UUID reference = UUID.randomUUID();
        Account account = lock(data.accountNumber()).get(data.accountNumber());

        List<Transaction> entries = List.of(account.credit(reference, TransactionType.DEPOSIT, data.amount(),
                describe(data.description(), "Consignación"), clock));
        return persist(reference, entries, account);
    }

    @Override
    public TransactionReceipt withdraw(MovementData data) {
        UUID reference = UUID.randomUUID();
        Account account = lock(data.accountNumber()).get(data.accountNumber());

        List<Transaction> entries = new ArrayList<>();
        entries.add(account.debit(reference, TransactionType.WITHDRAWAL, data.amount(),
                describe(data.description(), "Retiro"), clock));
        account.chargeGmf(reference, data.amount(), clock).ifPresent(entries::add);
        return persist(reference, entries, account);
    }

    /** Debit on the source and credit on the target, plus the GMF on the source (RF-22, SUP-10). */
    @Override
    public TransactionReceipt transfer(TransferData data) {
        String sourceNumber = data.sourceAccountNumber();
        String targetNumber = data.targetAccountNumber();
        if (sourceNumber.equals(targetNumber)) {
            throw new BusinessRuleViolationException("No se puede transferir a la misma cuenta");
        }
        UUID reference = UUID.randomUUID();
        Map<String, Account> accounts = lock(sourceNumber, targetNumber);
        Account source = accounts.get(sourceNumber);
        Account target = accounts.get(targetNumber);

        List<Transaction> entries = new ArrayList<>();
        entries.add(source.debit(reference, TransactionType.TRANSFER, data.amount(),
                describe(data.description(), "Transferencia a " + targetNumber), clock));
        source.chargeGmf(reference, data.amount(), clock).ifPresent(entries::add);
        entries.add(target.credit(reference, TransactionType.TRANSFER, data.amount(),
                describe(data.description(), "Transferencia de " + sourceNumber), clock));
        return persist(reference, entries, source, target);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountStatement getStatement(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la cuenta con id " + accountId));
        return new AccountStatement(account, transactionRepository.findByAccountId(accountId));
    }

    /** Locks every account of the operation in one query, ordered by id to avoid deadlocks. */
    private Map<String, Account> lock(String... accountNumbers) {
        Map<String, Account> accounts = accountRepository.findByAccountNumbersForUpdate(List.of(accountNumbers))
                .stream()
                .collect(Collectors.toMap(Account::getAccountNumber, Function.identity()));
        for (String accountNumber : accountNumbers) {
            if (!accounts.containsKey(accountNumber)) {
                throw new ResourceNotFoundException("No existe la cuenta " + accountNumber);
            }
        }
        return accounts;
    }

    private TransactionReceipt persist(UUID reference, List<Transaction> entries, Account... accounts) {
        for (Account account : accounts) {
            accountRepository.save(account);
        }
        return new TransactionReceipt(reference, transactionRepository.saveAll(entries));
    }

    private static String describe(String description, String defaultDescription) {
        return description == null || description.isBlank() ? defaultDescription : description.strip();
    }
}
