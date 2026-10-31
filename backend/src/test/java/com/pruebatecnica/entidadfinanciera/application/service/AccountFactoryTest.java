package com.pruebatecnica.entidadfinanciera.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountNumberSequencePort;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountFactoryTest {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), ZoneId.of("America/Bogota"));

    @Mock
    private AccountNumberSequencePort numberSequence;

    private AccountFactory factory;

    @BeforeEach
    void setUp() {
        factory = new AccountFactory(numberSequence, CLOCK);
    }

    @Test
    void savingsNumberStartsWith53AndHasTenDigits() {
        when(numberSequence.nextValue(AccountType.SAVINGS)).thenReturn(3L);

        Account account = factory.open(new OpenAccountData(1L, AccountType.SAVINGS, null, false));

        assertThat(account.getAccountNumber()).isEqualTo("5300000003").hasSize(10);
    }

    @Test
    void checkingNumberStartsWith33AndHasTenDigits() {
        when(numberSequence.nextValue(AccountType.CHECKING)).thenReturn(99_999_999L);

        Account account = factory.open(new OpenAccountData(1L, AccountType.CHECKING, null, false));

        assertThat(account.getAccountNumber()).isEqualTo("3399999999").hasSize(10);
    }
}
