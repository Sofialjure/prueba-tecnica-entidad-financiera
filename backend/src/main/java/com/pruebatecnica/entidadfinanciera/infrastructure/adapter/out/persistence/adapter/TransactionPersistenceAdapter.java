package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.adapter;

import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.port.out.TransactionRepositoryPort;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper.TransactionPersistenceMapper;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository.TransactionJpaRepository;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class TransactionPersistenceAdapter implements TransactionRepositoryPort {

    private final TransactionJpaRepository repository;
    private final TransactionPersistenceMapper mapper;

    public TransactionPersistenceAdapter(TransactionJpaRepository repository, TransactionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public void saveAll(List<Transaction> transactions) {
        repository.saveAll(transactions.stream().map(mapper::toEntity).toList());
    }

    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        return repository.findByAccountIdOrderByCreatedAtDescIdDesc(accountId).stream().map(mapper::toDomain).toList();
    }
}
