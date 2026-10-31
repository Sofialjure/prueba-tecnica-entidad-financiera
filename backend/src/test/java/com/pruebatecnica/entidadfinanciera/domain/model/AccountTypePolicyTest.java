package com.pruebatecnica.entidadfinanciera.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AccountTypePolicyTest {

    private final AccountTypePolicy savings = AccountType.SAVINGS.policy();
    private final AccountTypePolicy checking = AccountType.CHECKING.policy();

    @Test
    void eachTypeHasItsOwnNumberPrefix() {
        assertThat(savings.numberPrefix()).isEqualTo("53");
        assertThat(checking.numberPrefix()).isEqualTo("33");
    }

    @Test
    void savingsNeverGoesBelowZero() {
        assertThat(savings.minimumBalance(BigDecimal.ZERO)).isEqualByComparingTo("0");
    }

    @Test
    void checkingMayGoNegativeDownToItsOverdraftLimit() {
        assertThat(checking.minimumBalance(new BigDecimal("500000"))).isEqualByComparingTo("-500000");
    }

    @Test
    void savingsOnlyAcceptsZeroOverdraft() {
        assertThatNoException().isThrownBy(() -> savings.validateOverdraftLimit(BigDecimal.ZERO));
        assertThatThrownBy(() -> savings.validateOverdraftLimit(BigDecimal.ONE))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void checkingAcceptsZeroOrPositiveOverdraft() {
        assertThatNoException().isThrownBy(() -> checking.validateOverdraftLimit(BigDecimal.ZERO));
        assertThatNoException().isThrownBy(() -> checking.validateOverdraftLimit(new BigDecimal("500000")));
        assertThatThrownBy(() -> checking.validateOverdraftLimit(new BigDecimal("-0.01")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }
}
