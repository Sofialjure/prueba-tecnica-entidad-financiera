package com.pruebatecnica.entidadfinanciera.application.service;

import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Account;
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

    /** An account can only exist linked to an existing customer (RF-10). */
    @Override
    public Account open(OpenAccountData data) {
        ensureCustomerExists(data.customerId());
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

    private static ResourceNotFoundException notFound(Long id) {
        return new ResourceNotFoundException("No existe la cuenta con id " + id);
    }

    private void ensureCustomerExists(Long customerId) {
        if (customerRepository.findById(customerId).isEmpty()) {
            throw new ResourceNotFoundException("No existe el cliente con id " + customerId);
        }
    }
}
