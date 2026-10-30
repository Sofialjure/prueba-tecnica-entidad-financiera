package com.pruebatecnica.entidadfinanciera.domain.port.out;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import java.util.List;
import java.util.Optional;

public interface CustomerRepositoryPort {

    Customer save(Customer customer);

    Optional<Customer> findById(Long id);

    List<Customer> findAll();

    boolean existsByIdentification(IdentificationType type, String number);

    boolean existsByIdentificationExcludingId(IdentificationType type, String number, Long excludedId);

    /** Whether the customer owns any account, whatever its status (SUP-08). */
    boolean hasAccounts(Long customerId);

    void deleteById(Long id);
}
