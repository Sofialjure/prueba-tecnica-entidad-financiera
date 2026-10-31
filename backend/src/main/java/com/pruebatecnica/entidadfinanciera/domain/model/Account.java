package com.pruebatecnica.entidadfinanciera.domain.model;

import com.pruebatecnica.entidadfinanciera.domain.exception.BusinessRuleViolationException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

/**
 * A savings or checking account owned by a customer.
 * New accounts are built with {@link #open}, which applies the opening rules;
 * {@link #builder()} only rebuilds accounts that were already stored.
 */
public class Account {

    public static final int MONEY_SCALE = 2;

    private Long id;
    private AccountType accountType;
    private String accountNumber;
    private AccountStatus status;
    private BigDecimal balance;
    private BigDecimal overdraftLimit;
    private boolean gmfExempt;
    private Long customerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Account() {
    }

    /** Opens an active account with balance $0 (RF-13, SUP-03); the number comes from the factory. */
    public static Account open(OpenAccountData data, String accountNumber, Clock clock) {
        BigDecimal overdraftLimit = money(data.overdraftLimit() == null ? BigDecimal.ZERO : data.overdraftLimit());
        data.accountType().policy().validateOverdraftLimit(overdraftLimit);

        Account account = new Account();
        account.accountType = data.accountType();
        account.accountNumber = accountNumber;
        account.status = AccountStatus.ACTIVE;
        account.balance = money(BigDecimal.ZERO);
        account.overdraftLimit = overdraftLimit;
        account.gmfExempt = data.gmfExempt();
        account.customerId = data.customerId();
        account.touch(clock);
        account.createdAt = account.updatedAt;
        return account;
    }

    /** Balance plus overdraft limit (SUP-02). */
    public BigDecimal getAvailableBalance() {
        return balance.add(overdraftLimit);
    }

    public BigDecimal getMinimumBalance() {
        return accountType.policy().minimumBalance(overdraftLimit);
    }

    /** Reactivates an inactive account (RF-15); a cancelled one can never come back (SUP-04). */
    public void activate(Clock clock) {
        rejectIfCancelled("reactivar");
        if (status == AccountStatus.ACTIVE) {
            throw new BusinessRuleViolationException("La cuenta " + accountNumber + " ya está activa");
        }
        changeStatus(AccountStatus.ACTIVE, clock);
    }

    /** Inactivates an active account (RF-15). */
    public void deactivate(Clock clock) {
        rejectIfCancelled("inactivar");
        if (status == AccountStatus.INACTIVE) {
            throw new BusinessRuleViolationException("La cuenta " + accountNumber + " ya está inactiva");
        }
        changeStatus(AccountStatus.INACTIVE, clock);
    }

    /** Closes the account for good; only allowed with balance exactly $0 (RF-16, SUP-09). */
    public void cancel(Clock clock) {
        if (status == AccountStatus.CANCELLED) {
            throw new BusinessRuleViolationException("La cuenta " + accountNumber + " ya está cancelada");
        }
        if (balance.signum() != 0) {
            throw new BusinessRuleViolationException("La cuenta " + accountNumber
                    + " solo se puede cancelar con saldo $0 (saldo actual: " + balance.toPlainString() + ")");
        }
        changeStatus(AccountStatus.CANCELLED, clock);
    }

    /** Adds money to the account (RF-20) and returns the movement with the new balance. */
    public Transaction credit(UUID reference, TransactionType type, BigDecimal amount, String description,
            Clock clock) {
        BigDecimal value = validateMovement(amount);
        balance = balance.add(value);
        return movement(reference, type, EntryType.CREDIT, value, description, clock);
    }

    /** Takes money out while the available balance covers it (RF-14, RF-21, SUP-01). */
    public Transaction debit(UUID reference, TransactionType type, BigDecimal amount, String description,
            Clock clock) {
        BigDecimal value = validateMovement(amount);
        if (getAvailableBalance().compareTo(value) < 0) {
            throw new BusinessRuleViolationException("Saldo disponible insuficiente en la cuenta " + accountNumber);
        }
        balance = balance.subtract(value);
        return movement(reference, type, EntryType.DEBIT, value, description, clock);
    }

    /** Charges the 4x1000 on a debited amount, unless the account is exempt or the tax rounds to $0 (SUP-10). */
    public Optional<Transaction> chargeGmf(UUID reference, BigDecimal debitedAmount, Clock clock) {
        BigDecimal gmf = Gmf.of(debitedAmount);
        if (gmfExempt || gmf.signum() == 0) {
            return Optional.empty();
        }
        return Optional.of(debit(reference, TransactionType.GMF, gmf, Gmf.DESCRIPTION, clock));
    }

    /** Only active accounts move money (SUP-05) and every amount must be positive (SUP-06). */
    private BigDecimal validateMovement(BigDecimal amount) {
        if (status != AccountStatus.ACTIVE) {
            throw new BusinessRuleViolationException(
                    "La cuenta " + accountNumber + " no está activa y no permite movimientos");
        }
        if (amount.signum() <= 0) {
            throw new BusinessRuleViolationException("El monto de la transacción debe ser mayor a $0");
        }
        return money(amount);
    }

    private Transaction movement(UUID reference, TransactionType type, EntryType entryType, BigDecimal amount,
            String description, Clock clock) {
        touch(clock);
        return new Transaction(null, reference, id, accountNumber, type, entryType, amount, balance, description,
                updatedAt);
    }

    private void rejectIfCancelled(String action) {
        if (status == AccountStatus.CANCELLED) {
            throw new BusinessRuleViolationException(
                    "La cuenta " + accountNumber + " está cancelada y no se puede " + action);
        }
    }

    private void changeStatus(AccountStatus newStatus, Clock clock) {
        status = newStatus;
        touch(clock);
    }

    private void touch(Clock clock) {
        updatedAt = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
    }

    private static BigDecimal money(BigDecimal amount) {
        return amount.setScale(MONEY_SCALE, RoundingMode.HALF_EVEN);
    }

    public Long getId() {
        return id;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public BigDecimal getOverdraftLimit() {
        return overdraftLimit;
    }

    public boolean isGmfExempt() {
        return gmfExempt;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    /** Rebuilds a stored account without re-running the opening rules. */
    public static final class Builder {

        private final Account account = new Account();

        private Builder() {
        }

        public Builder id(Long id) {
            account.id = id;
            return this;
        }

        public Builder accountType(AccountType accountType) {
            account.accountType = accountType;
            return this;
        }

        public Builder accountNumber(String accountNumber) {
            account.accountNumber = accountNumber;
            return this;
        }

        public Builder status(AccountStatus status) {
            account.status = status;
            return this;
        }

        public Builder balance(BigDecimal balance) {
            account.balance = balance;
            return this;
        }

        public Builder overdraftLimit(BigDecimal overdraftLimit) {
            account.overdraftLimit = overdraftLimit;
            return this;
        }

        public Builder gmfExempt(boolean gmfExempt) {
            account.gmfExempt = gmfExempt;
            return this;
        }

        public Builder customerId(Long customerId) {
            account.customerId = customerId;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            account.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            account.updatedAt = updatedAt;
            return this;
        }

        public Account build() {
            return account;
        }
    }
}
