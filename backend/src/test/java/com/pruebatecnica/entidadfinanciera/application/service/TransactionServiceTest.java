package com.pruebatecnica.entidadfinanciera.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatement;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatus;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.EntryType;
import com.pruebatecnica.entidadfinanciera.domain.model.MovementData;
import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionReceipt;
import com.pruebatecnica.entidadfinanciera.domain.model.TransactionType;
import com.pruebatecnica.entidadfinanciera.domain.model.TransferData;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.TransactionRepositoryPort;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), ZoneId.of("America/Bogota"));

    @Mock
    private AccountRepositoryPort accountRepository;
    @Mock
    private TransactionRepositoryPort transactionRepository;

    private TransactionService service;

    @BeforeEach
    void setUp() {
        service = new TransactionService(accountRepository, transactionRepository, CLOCK);
        // The repository hands the movements back with the ids the database would assign
        lenient().when(transactionRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Transaction> movements = invocation.getArgument(0);
            return IntStream.range(0, movements.size()).mapToObj(i -> withId(movements.get(i), i + 1L)).toList();
        });
    }

    @Test
    void depositCreditsAccountAndSavesOneMovement() {
        Account account = account(1L, "5300000001", "1000.00", "0.00", false);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001"))).thenReturn(List.of(account));

        TransactionReceipt receipt = service.deposit(new MovementData("5300000001", new BigDecimal("500"), null));

        assertThat(account.getBalance()).isEqualByComparingTo("1500");
        assertThat(receipt.entries()).singleElement().satisfies(entry -> {
            assertThat(entry.id()).isEqualTo(1L);
            assertThat(entry.reference()).isEqualTo(receipt.reference());
            assertThat(entry.type()).isEqualTo(TransactionType.DEPOSIT);
            assertThat(entry.entryType()).isEqualTo(EntryType.CREDIT);
            assertThat(entry.balanceAfter()).isEqualByComparingTo("1500");
            assertThat(entry.description()).isEqualTo("Consignación");
            assertThat(entry.createdAt()).isEqualTo(LocalDateTime.of(2026, 10, 30, 10, 0));
        });
        verify(accountRepository).save(account);
        verify(transactionRepository).saveAll(any());
    }

    @Test
    void depositKeepsCustomDescription() {
        Account account = account(1L, "5300000001", "0.00", "0.00", false);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001"))).thenReturn(List.of(account));

        TransactionReceipt receipt = service.deposit(new MovementData("5300000001", BigDecimal.TEN, "  Nómina "));

        assertThat(receipt.entries().getFirst().description()).isEqualTo("Nómina");
    }

    @Test
    void blankDescriptionFallsBackToDefault() {
        Account account = account(1L, "5300000002", "1000.00", "0.00", true);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000002"))).thenReturn(List.of(account));

        TransactionReceipt receipt = service.withdraw(new MovementData("5300000002", BigDecimal.TEN, "   "));

        assertThat(receipt.entries().getFirst().description()).isEqualTo("Retiro");
    }

    @Test
    void depositFailsWhenAccountDoesNotExist() {
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5399999999"))).thenReturn(List.of());

        assertThatThrownBy(() -> service.deposit(new MovementData("5399999999", BigDecimal.TEN, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe la cuenta 5399999999");
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void withdrawalChargesGmfOnNonExemptAccount() {
        Account account = account(1L, "5300000001", "200000.00", "0.00", false);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001"))).thenReturn(List.of(account));

        TransactionReceipt receipt = service.withdraw(new MovementData("5300000001", new BigDecimal("100000"), null));

        assertThat(receipt.entries())
                .extracting(Transaction::type, Transaction::entryType, Transaction::amount, Transaction::balanceAfter)
                .containsExactly(
                        tuple(TransactionType.WITHDRAWAL, EntryType.DEBIT, new BigDecimal("100000.00"),
                                new BigDecimal("100000.00")),
                        tuple(TransactionType.GMF, EntryType.DEBIT, new BigDecimal("400.00"),
                                new BigDecimal("99600.00")));
        assertThat(receipt.entries()).extracting(Transaction::reference).containsOnly(receipt.reference());
        assertThat(account.getBalance()).isEqualByComparingTo("99600");
    }

    @Test
    void withdrawalOnExemptAccountHasNoGmf() {
        Account account = account(1L, "5300000002", "600000.00", "0.00", true);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000002"))).thenReturn(List.of(account));

        TransactionReceipt receipt = service.withdraw(new MovementData("5300000002", new BigDecimal("100000"), "Cajero"));

        assertThat(receipt.entries()).singleElement()
                .satisfies(entry -> assertThat(entry.description()).isEqualTo("Cajero"));
        assertThat(account.getBalance()).isEqualByComparingTo("500000");
    }

    @Test
    void withdrawalFailsWhenBalanceDoesNotCoverAmountPlusGmf() {
        Account account = account(1L, "5300000001", "100000.00", "0.00", false);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001"))).thenReturn(List.of(account));

        assertThatThrownBy(() -> service.withdraw(new MovementData("5300000001", new BigDecimal("100000"), null)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("Saldo disponible insuficiente en la cuenta 5300000001");
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void transferDebitsSourceChargesGmfAndCreditsTarget() {
        Account source = account(1L, "5300000001", "1799200.00", "0.00", false);
        Account target = account(2L, "3300000001", "899600.00", "500000.00", false);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001", "3300000001")))
                .thenReturn(List.of(source, target));

        TransactionReceipt receipt = service.transfer(
                new TransferData("5300000001", "3300000001", new BigDecimal("100000"), null));

        assertThat(receipt.entries())
                .extracting(Transaction::accountNumber, Transaction::type, Transaction::entryType,
                        Transaction::amount, Transaction::description)
                .containsExactly(
                        tuple("5300000001", TransactionType.TRANSFER, EntryType.DEBIT, new BigDecimal("100000.00"),
                                "Transferencia a 3300000001"),
                        tuple("5300000001", TransactionType.GMF, EntryType.DEBIT, new BigDecimal("400.00"),
                                "GMF 4x1000"),
                        tuple("3300000001", TransactionType.TRANSFER, EntryType.CREDIT, new BigDecimal("100000.00"),
                                "Transferencia de 5300000001"));
        assertThat(source.getBalance()).isEqualByComparingTo("1698800");
        assertThat(target.getBalance()).isEqualByComparingTo("999600");
        assertThat(target.getAvailableBalance()).isEqualByComparingTo("1499600");
        verify(accountRepository).save(source);
        verify(accountRepository).save(target);
        verify(transactionRepository).saveAll(any());
    }

    @Test
    void transferRejectsSameAccount() {
        assertThatThrownBy(() -> service.transfer(
                new TransferData("5300000001", "5300000001", BigDecimal.TEN, null)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("No se puede transferir a la misma cuenta");
        verifyNoInteractions(accountRepository, transactionRepository);
    }

    @Test
    void transferFailsWhenTargetDoesNotExist() {
        Account source = account(1L, "5300000001", "1000.00", "0.00", false);
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001", "3399999999")))
                .thenReturn(List.of(source));

        assertThatThrownBy(() -> service.transfer(
                new TransferData("5300000001", "3399999999", BigDecimal.TEN, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe la cuenta 3399999999");
        assertThat(source.getBalance()).isEqualByComparingTo("1000");
    }

    @Test
    void transferRejectsInactiveTargetWithoutSaving() {
        Account source = account(1L, "5300000001", "1000.00", "0.00", true);
        Account target = Account.builder().id(4L).accountNumber("3300000002").accountType(AccountType.CHECKING)
                .status(AccountStatus.INACTIVE).balance(new BigDecimal("0.00"))
                .overdraftLimit(new BigDecimal("1000000.00")).build();
        when(accountRepository.findByAccountNumbersForUpdate(List.of("5300000001", "3300000002")))
                .thenReturn(List.of(source, target));

        assertThatThrownBy(() -> service.transfer(
                new TransferData("5300000001", "3300000002", BigDecimal.TEN, null)))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 3300000002 no está activa y no permite movimientos");
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void statementReturnsAccountAndItsMovements() {
        Account account = account(1L, "5300000001", "1799200.00", "0.00", false);
        List<Transaction> movements = List.of(new Transaction(3L, null, 1L, "5300000001", TransactionType.GMF,
                EntryType.DEBIT, new BigDecimal("800.00"), new BigDecimal("1799200.00"), "GMF 4x1000", null));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(transactionRepository.findByAccountId(1L)).thenReturn(movements);

        AccountStatement statement = service.getStatement(1L);

        assertThat(statement.account()).isSameAs(account);
        assertThat(statement.transactions()).isEqualTo(movements);
    }

    @Test
    void statementFailsWhenAccountDoesNotExist() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getStatement(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe la cuenta con id 99");
    }

    private static Transaction withId(Transaction t, Long id) {
        return new Transaction(id, t.reference(), t.accountId(), t.accountNumber(), t.type(), t.entryType(),
                t.amount(), t.balanceAfter(), t.description(), t.createdAt());
    }

    private static Account account(Long id, String number, String balance, String overdraftLimit,
            boolean gmfExempt) {
        LocalDateTime created = LocalDateTime.of(2026, 10, 1, 8, 0);
        return Account.builder()
                .id(id)
                .accountType(number.startsWith("53") ? AccountType.SAVINGS : AccountType.CHECKING)
                .accountNumber(number)
                .status(AccountStatus.ACTIVE)
                .balance(new BigDecimal(balance))
                .overdraftLimit(new BigDecimal(overdraftLimit))
                .gmfExempt(gmfExempt)
                .customerId(1L)
                .createdAt(created)
                .updatedAt(created)
                .build();
    }
}
