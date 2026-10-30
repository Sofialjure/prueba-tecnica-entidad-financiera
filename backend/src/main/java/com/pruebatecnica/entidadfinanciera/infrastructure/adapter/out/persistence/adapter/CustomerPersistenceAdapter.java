package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.adapter;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper.CustomerPersistenceMapper;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository.CustomerJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class CustomerPersistenceAdapter implements CustomerRepositoryPort {

    private final CustomerJpaRepository repository;
    private final CustomerPersistenceMapper mapper;

    public CustomerPersistenceAdapter(CustomerJpaRepository repository, CustomerPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Customer save(Customer customer) {
        return mapper.toDomain(repository.save(mapper.toEntity(customer)));
    }

    @Override
    public Optional<Customer> findById(Long id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Customer> findAll() {
        return repository.findAll(Sort.by("id")).stream().map(mapper::toDomain).toList();
    }

    @Override
    public boolean existsByIdentification(IdentificationType type, String number) {
        return repository.existsByIdentificationTypeAndIdentificationNumber(type, number);
    }

    @Override
    public boolean existsByIdentificationExcludingId(IdentificationType type, String number, Long excludedId) {
        return repository.existsByIdentificationTypeAndIdentificationNumberAndIdNot(type, number, excludedId);
    }

    @Override
    public boolean hasAccounts(Long customerId) {
        return repository.hasAccounts(customerId);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
