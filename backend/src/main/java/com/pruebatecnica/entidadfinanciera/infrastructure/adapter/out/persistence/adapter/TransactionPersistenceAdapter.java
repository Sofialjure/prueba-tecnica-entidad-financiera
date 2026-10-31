package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.adapter;

import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.domain.port.out.TransactionRepositoryPort;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.TransactionEntity;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper.TransactionPersistenceMapper;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository.TransactionJpaRepository;
import java.util.List;
import java.util.stream.IntStream;
import org.springframework.stereotype.Component;

@Component
public class TransactionPersistenceAdapter implements TransactionRepositoryPort {

    private final TransactionJpaRepository repository;
    private final TransactionPersistenceMapper mapper;

    public TransactionPersistenceAdapter(TransactionJpaRepository repository, TransactionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /** Keeps the domain values and only takes the ids: the account number is computed by the database on read. */
    @Override
    public List<Transaction> saveAll(List<Transaction> transactions) {
        List<TransactionEntity> saved = repository.saveAll(transactions.stream().map(mapper::toEntity).toList());
        return IntStream.range(0, transactions.size())
                .mapToObj(i -> withId(transactions.get(i), saved.get(i).getId()))
                .toList();
    }

    private static Transaction withId(Transaction t, Long id) {
        return new Transaction(id, t.reference(), t.accountId(), t.accountNumber(), t.type(), t.entryType(),
                t.amount(), t.balanceAfter(), t.description(), t.createdAt());
    }

    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        return repository.findByAccountIdOrderByCreatedAtDescIdDesc(accountId).stream().map(mapper::toDomain).toList();
    }
}
