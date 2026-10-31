package com.pruebatecnica.entidadfinanciera.application.service;

import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceConflictException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.domain.port.in.ChangeAccountStatusUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetAccountUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.OpenAccountUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import java.time.Clock;
import java.util.List;
import java.util.function.BiConsumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AccountService implements OpenAccountUseCase, GetAccountUseCase, ChangeAccountStatusUseCase {

    private final AccountRepositoryPort accountRepository;
    private final CustomerRepositoryPort customerRepository;
    private final AccountFactory accountFactory;
    private final Clock clock;

    public AccountService(AccountRepositoryPort accountRepository, CustomerRepositoryPort customerRepository,
            AccountFactory accountFactory, Clock clock) {
        this.accountRepository = accountRepository;
        this.customerRepository = customerRepository;
        this.accountFactory = accountFactory;
        this.clock = clock;
    }

    /**
     * An account can only exist linked to an existing customer (RF-10), and a customer has at most
     * one active or inactive account of each type (SUP-15). Checked before generating the number,
     * so a rejected request does not use up a consecutive.
     */
    @Override
    public Account open(OpenAccountData data) {
        ensureCustomerExists(data.customerId());
        if (accountRepository.hasOpenAccountOfType(data.customerId(), data.accountType())) {
            throw new ResourceConflictException("El cliente con id " + data.customerId() + " ya tiene una "
                    + accountTypeName(data.accountType())
                    + " activa o inactiva. Solo se permite una cuenta de cada tipo por cliente");
        }
        return accountRepository.save(accountFactory.open(data));
    }

    @Override
    @Transactional(readOnly = true)
    public Account getById(Long id) {
        return accountRepository.findById(id).orElseThrow(() -> notFound(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Account> getAll() {
        return accountRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Account> getByCustomerId(Long customerId) {
        ensureCustomerExists(customerId);
        return accountRepository.findByCustomerId(customerId);
    }

    @Override
    public Account activate(Long id) {
        return changeStatus(id, Account::activate);
    }

    @Override
    public Account deactivate(Long id) {
        return changeStatus(id, Account::deactivate);
    }

    @Override
    public Account cancel(Long id) {
        return changeStatus(id, Account::cancel);
    }

    /** Locks the account so a concurrent deposit cannot slip in between the balance check and the save. */
    private Account changeStatus(Long id, BiConsumer<Account, Clock> transition) {
        Account account = accountRepository.findByIdForUpdate(id).orElseThrow(() -> notFound(id));
        transition.accept(account, clock);
        return accountRepository.save(account);
    }

    private static String accountTypeName(AccountType type) {
        return switch (type) {
            case SAVINGS -> "cuenta de ahorros";
            case CHECKING -> "cuenta corriente";
        };
    }

    private static ResourceNotFoundException notFound(Long id) {
        return new ResourceNotFoundException("No existe la cuenta con id " + id);
    }

    private void ensureCustomerExists(Long customerId) {
        if (customerRepository.findById(customerId).isEmpty()) {
            throw new ResourceNotFoundException("No existe el cliente con id " + customerId);
        }
    }
}
