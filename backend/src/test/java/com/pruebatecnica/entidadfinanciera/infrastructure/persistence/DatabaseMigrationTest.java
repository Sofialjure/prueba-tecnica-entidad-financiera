package com.pruebatecnica.entidadfinanciera.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pruebatecnica.entidadfinanciera.TestcontainersConfiguration;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifies the Flyway migrations: seed data and the business rules enforced by the database.
 * Each test rolls back, so the seed data stays untouched.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Transactional
class DatabaseMigrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void seedDataIsLoaded() {
        assertThat(count("customers")).isEqualTo(3);
        assertThat(count("accounts")).isEqualTo(4);
        assertThat(count("transactions")).isEqualTo(8);
    }

    @Test
    void seedBalancesMatchTheLastMovementOfEachAccount() {
        Integer mismatches = jdbc.queryForObject("""
                SELECT count(*) FROM accounts a
                JOIN LATERAL (
                    SELECT balance_after FROM transactions t
                    WHERE t.account_id = a.id ORDER BY t.created_at DESC, t.id DESC LIMIT 1
                ) last ON true
                WHERE last.balance_after <> a.balance
                """, Integer.class);
        assertThat(mismatches).isZero();
    }

    @Test
    void availableBalanceIsGeneratedFromBalanceAndOverdraftLimit() {
        BigDecimal available = jdbc.queryForObject(
                "SELECT available_balance FROM accounts WHERE account_number = '3300000001'", BigDecimal.class);
        assertThat(available).isEqualByComparingTo("1399600.00");

        jdbc.update("UPDATE accounts SET balance = balance - 1000000 WHERE account_number = '3300000001'");

        BigDecimal updated = jdbc.queryForObject(
                "SELECT available_balance FROM accounts WHERE account_number = '3300000001'", BigDecimal.class);
        assertThat(updated).isEqualByComparingTo("399600.00");
    }

    @Test
    void rejectsUnderageCustomer() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO customers (identification_type, identification_number, first_name, last_name, email, birth_date)
                VALUES ('CC', '1111111111', 'Menor', 'Edad', 'menor@correo.com', CURRENT_DATE - INTERVAL '17 years')
                """))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_customers_legal_age");
    }

    @Test
    void rejectsDuplicatedIdentification() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO customers (identification_type, identification_number, first_name, last_name, email, birth_date)
                VALUES ('CC', '1020304050', 'Otra', 'Persona', 'otra@correo.com', '1990-01-01')
                """))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("uk_customers_identification");
    }

    @Test
    void rejectsDeletingCustomerWithAccounts() {
        assertThatThrownBy(() -> jdbc.update(
                "DELETE FROM customers WHERE identification_number = '1020304050'"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("fk_accounts_customer");
    }

    @Test
    void rejectsNegativeBalanceOnSavingsAccount() {
        assertThatThrownBy(() -> jdbc.update(
                "UPDATE accounts SET balance = -1 WHERE account_number = '5300000001'"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_accounts_minimum_balance");
    }

    @Test
    void allowsCheckingAccountOverdraftUpToItsLimit() {
        int updated = jdbc.update("UPDATE accounts SET balance = -500000 WHERE account_number = '3300000001'");
        assertThat(updated).isEqualTo(1);

        assertThatThrownBy(() -> jdbc.update(
                "UPDATE accounts SET balance = -500000.01 WHERE account_number = '3300000001'"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_accounts_minimum_balance");
    }

    @Test
    void rejectsCancellingAccountWithNonZeroBalance() {
        assertThatThrownBy(() -> jdbc.update(
                "UPDATE accounts SET status = 'CANCELLED' WHERE account_number = '5300000001'"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_accounts_cancelled_zero_balance");
    }

    @Test
    void rejectsCancelledAccountThatKeepsAnOverdraft() {
        assertThatThrownBy(() -> jdbc.update(
                "UPDATE accounts SET status = 'CANCELLED' WHERE account_number = '3300000002'"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_accounts_cancelled_no_overdraft");
    }

    @Test
    void rejectsAccountNumberWithWrongPrefixForItsType() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO accounts (account_type, account_number, customer_id)
                SELECT 'SAVINGS', '3300000099', id FROM customers WHERE identification_number = '79845123'
                """))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_accounts_account_number_prefix");
    }

    @Test
    void rejectsNonPositiveTransactionAmount() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO transactions (reference, account_id, type, entry_type, amount, balance_after)
                SELECT gen_random_uuid(), id, 'DEPOSIT', 'CREDIT', 0, balance FROM accounts WHERE account_number = '5300000001'
                """))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("ck_transactions_amount");
    }

    private int count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class);
    }
}
