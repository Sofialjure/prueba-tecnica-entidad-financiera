package com.pruebatecnica.entidadfinanciera.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class AccountTest {

    private static final ZoneId BOGOTA = ZoneId.of("America/Bogota");
    /** 2026-10-30 10:00 in Bogotá. */
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-30T15:00:00Z"), BOGOTA);
    /** One hour later than {@link #CLOCK}. */
    private static final Clock LATER = Clock.fixed(Instant.parse("2026-10-30T16:00:00Z"), BOGOTA);
    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 10, 30, 10, 0);

    @Test
    void openCreatesActiveSavingsAccountWithZeroBalance() {
        Account account = Account.open(new OpenAccountData(1L, AccountType.SAVINGS, null, true), "5300000003", CLOCK);

        assertThat(account.getId()).isNull();
        assertThat(account.getAccountType()).isEqualTo(AccountType.SAVINGS);
        assertThat(account.getAccountNumber()).isEqualTo("5300000003");
        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getBalance()).isEqualByComparingTo("0").hasScaleOf(Account.MONEY_SCALE);
        assertThat(account.getOverdraftLimit()).isEqualByComparingTo("0").hasScaleOf(Account.MONEY_SCALE);
        assertThat(account.getAvailableBalance()).isEqualByComparingTo("0");
        assertThat(account.isGmfExempt()).isTrue();
        assertThat(account.getCustomerId()).isEqualTo(1L);
        assertThat(account.getCreatedAt()).isEqualTo(CREATED);
        assertThat(account.getUpdatedAt()).isEqualTo(CREATED);
    }

    @Test
    void openCreatesActiveCheckingAccountWithOverdraft() {
        Account account = Account.open(
                new OpenAccountData(1L, AccountType.CHECKING, new BigDecimal("500000"), false), "3300000003", CLOCK);

        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getOverdraftLimit()).isEqualByComparingTo("500000").hasScaleOf(Account.MONEY_SCALE);
        assertThat(account.getAvailableBalance()).isEqualByComparingTo("500000");
        assertThat(account.getMinimumBalance()).isEqualByComparingTo("-500000");
    }

    @Test
    void openRejectsOverdraftOnSavingsAccount() {
        OpenAccountData data = new OpenAccountData(1L, AccountType.SAVINGS, new BigDecimal("1000"), false);

        assertThatThrownBy(() -> Account.open(data, "5300000003", CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta de ahorros no admite cupo de sobregiro");
    }

    @Test
    void openRejectsNegativeOverdraftOnCheckingAccount() {
        OpenAccountData data = new OpenAccountData(1L, AccountType.CHECKING, new BigDecimal("-1"), false);

        assertThatThrownBy(() -> Account.open(data, "3300000003", CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("El cupo de sobregiro no puede ser negativo");
    }

    @Test
    void availableBalanceAddsOverdraftToBalance() {
        Account account = stored(AccountType.CHECKING, AccountStatus.ACTIVE, "-200000.00", "500000.00");

        assertThat(account.getAvailableBalance()).isEqualByComparingTo("300000");
    }

    @Test
    void deactivateAndActivateChangeStatusAndModificationDate() {
        Account account = stored(AccountType.SAVINGS, AccountStatus.ACTIVE, "100.00", "0.00");

        account.deactivate(LATER);
        assertThat(account.getStatus()).isEqualTo(AccountStatus.INACTIVE);
        assertThat(account.getUpdatedAt()).isEqualTo(CREATED.plusHours(1));

        account.activate(CLOCK);
        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(account.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 10, 1, 8, 0));
    }

    @Test
    void activateRejectsAccountThatIsAlreadyActive() {
        Account account = stored(AccountType.SAVINGS, AccountStatus.ACTIVE, "0.00", "0.00");

        assertThatThrownBy(() -> account.activate(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 5300000001 ya está activa");
    }

    @Test
    void deactivateRejectsAccountThatIsAlreadyInactive() {
        Account account = stored(AccountType.SAVINGS, AccountStatus.INACTIVE, "0.00", "0.00");

        assertThatThrownBy(() -> account.deactivate(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 5300000001 ya está inactiva");
    }

    @Test
    void cancelledAccountCannotBeReactivatedNorInactivated() {
        Account account = stored(AccountType.SAVINGS, AccountStatus.CANCELLED, "0.00", "0.00");

        assertThatThrownBy(() -> account.activate(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 5300000001 está cancelada y no se puede reactivar");
        assertThatThrownBy(() -> account.deactivate(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 5300000001 está cancelada y no se puede inactivar");
    }

    @Test
    void cancelClosesActiveOrInactiveAccountWithZeroBalance() {
        Account active = stored(AccountType.SAVINGS, AccountStatus.ACTIVE, "0.00", "0.00");
        Account inactive = stored(AccountType.CHECKING, AccountStatus.INACTIVE, "0.00", "1000000.00");

        active.cancel(LATER);
        inactive.cancel(LATER);

        assertThat(active.getStatus()).isEqualTo(AccountStatus.CANCELLED);
        assertThat(active.getUpdatedAt()).isEqualTo(CREATED.plusHours(1));
        assertThat(inactive.getStatus()).isEqualTo(AccountStatus.CANCELLED);
    }

    @Test
    void cancelRejectsAccountWithPositiveBalance() {
        Account account = stored(AccountType.SAVINGS, AccountStatus.ACTIVE, "1799200.00", "0.00");

        assertThatThrownBy(() -> account.cancel(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 5300000001 solo se puede cancelar con saldo $0 (saldo actual: 1799200.00)");
        assertThat(account.getStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void cancelRejectsOverdrawnCheckingAccount() {
        Account account = stored(AccountType.CHECKING, AccountStatus.ACTIVE, "-50000.00", "500000.00");

        assertThatThrownBy(() -> account.cancel(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("saldo actual: -50000.00");
    }

    @Test
    void cancelRejectsAccountThatIsAlreadyCancelled() {
        Account account = stored(AccountType.SAVINGS, AccountStatus.CANCELLED, "0.00", "0.00");

        assertThatThrownBy(() -> account.cancel(CLOCK))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessage("La cuenta 5300000001 ya está cancelada");
    }

    private static Account stored(AccountType type, AccountStatus status, String balance, String overdraftLimit) {
        LocalDateTime created = LocalDateTime.of(2026, 10, 1, 8, 0);
        return Account.builder()
                .id(1L)
                .accountType(type)
                .accountNumber("5300000001")
                .status(status)
                .balance(new BigDecimal(balance))
                .overdraftLimit(new BigDecimal(overdraftLimit))
                .gmfExempt(false)
                .customerId(1L)
                .createdAt(created)
                .updatedAt(created)
                .build();
    }
}
