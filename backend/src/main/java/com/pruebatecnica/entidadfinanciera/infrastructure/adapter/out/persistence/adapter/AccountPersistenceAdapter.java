package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.adapter;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.AccountType;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountNumberSequencePort;
import com.pruebatecnica.entidadfinanciera.domain.port.out.AccountRepositoryPort;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper.AccountPersistenceMapper;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository.AccountJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class AccountPersistenceAdapter implements AccountRepositoryPort, AccountNumberSequencePort {

    private final AccountJpaRepository repository;
    private final AccountPersistenceMapper mapper;

    public AccountPersistenceAdapter(AccountJpaRepository repository, AccountPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Account save(Account account) {
        return mapper.toDomain(repository.save(mapper.toEntity(account)));
    }

    @Override
    public Optional<Account> findById(Long id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Account> findAll() {
        return repository.findAll(Sort.by("id")).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Account> findByCustomerId(Long customerId) {
        return repository.findByCustomerIdOrderById(customerId).stream().map(mapper::toDomain).toList();
    }

    /** PostgreSQL sequences never hand out the same value twice, even across concurrent transactions. */
    @Override
    public long nextValue(AccountType accountType) {
        return switch (accountType) {
            case SAVINGS -> repository.nextSavingsNumber();
            case CHECKING -> repository.nextCheckingNumber();
        };
    }
}
