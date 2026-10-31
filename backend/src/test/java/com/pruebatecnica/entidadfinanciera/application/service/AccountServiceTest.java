package com.pruebatecnica.entidadfinanciera.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountStatus;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
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
class AccountServiceTest {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), ZoneId.of("America/Bogota"));
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 30, 10, 0);

    @Mock
    private AccountRepositoryPort accountRepository;
    @Mock
    private CustomerRepositoryPort customerRepository;
    @Mock
    private AccountFactory accountFactory;

    private AccountService service;

    @BeforeEach
    void setUp() {
        service = new AccountService(accountRepository, customerRepository, accountFactory, CLOCK);
    }

    @Test
    void openSavesAccountBuiltByFactory() {
        OpenAccountData data = new OpenAccountData(1L, AccountType.SAVINGS, null, false);
        Account opened = Account.open(data, "5300000003", CLOCK);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(Customer.builder().id(1L).build()));
        when(accountFactory.open(data)).thenReturn(opened);
        when(accountRepository.save(opened)).thenReturn(opened);

        assertThat(service.open(data)).isSameAs(opened);
    }

    @Test
    void openFailsWhenCustomerDoesNotExist() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.open(new OpenAccountData(99L, AccountType.SAVINGS, null, false)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe el cliente con id 99");
        verifyNoInteractions(accountFactory, accountRepository);
    }

    @Test
    void getByIdReturnsAccount() {
        Account stored = stored(AccountStatus.ACTIVE, "0.00");
        when(accountRepository.findById(1L)).thenReturn(Optional.of(stored));

        assertThat(service.getById(1L)).isSameAs(stored);
    }

    @Test
    void getByIdFailsWhenAccountDoesNotExist() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe la cuenta con id 99");
    }

    @Test
    void getAllReturnsEveryAccount() {
        List<Account> accounts = List.of(stored(AccountStatus.ACTIVE, "0.00"));
        when(accountRepository.findAll()).thenReturn(accounts);

        assertThat(service.getAll()).isEqualTo(accounts);
    }

    @Test
    void getByCustomerIdReturnsCustomerAccounts() {
        List<Account> accounts = List.of(stored(AccountStatus.ACTIVE, "0.00"));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(Customer.builder().id(1L).build()));
        when(accountRepository.findByCustomerId(1L)).thenReturn(accounts);

        assertThat(service.getByCustomerId(1L)).isEqualTo(accounts);
    }

    @Test
    void getByCustomerIdFailsWhenCustomerDoesNotExist() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByCustomerId(99L)).isInstanceOf(ResourceNotFoundException.class);
        verify(accountRepository, never()).findByCustomerId(any());
    }

    @Test
    void activateSavesActiveAccount() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(stored(AccountStatus.INACTIVE, "0.00")));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account account = service.activate(1L);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void deactivateSavesInactiveAccount() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(stored(AccountStatus.ACTIVE, "100.00")));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.deactivate(1L).getStatus()).isEqualTo(AccountStatus.INACTIVE);
    }

    @Test
    void cancelSavesCancelledAccount() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(stored(AccountStatus.ACTIVE, "0.00")));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.cancel(1L).getStatus()).isEqualTo(AccountStatus.CANCELLED);
    }

    @Test
    void cancelRejectsAccountWithBalanceWithoutSaving() {
        when(accountRepository.findById(1L)).thenReturn(Optional.of(stored(AccountStatus.ACTIVE, "100.00")));

        assertThatThrownBy(() -> service.cancel(1L)).isInstanceOf(BusinessRuleViolationException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void statusChangeFailsWhenAccountDoesNotExist() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deactivate(99L)).isInstanceOf(ResourceNotFoundException.class);
        verify(accountRepository, never()).save(any());
    }

    private static Account stored(AccountStatus status, String balance) {
        LocalDateTime created = LocalDateTime.of(2026, 10, 1, 8, 0);
        return Account.builder()
                .id(1L)
                .accountType(AccountType.SAVINGS)
                .accountNumber("5300000001")
                .status(status)
                .balance(new BigDecimal(balance))
                .overdraftLimit(new BigDecimal("0.00"))
                .customerId(1L)
                .createdAt(created)
                .updatedAt(created)
                .build();
    }
}
