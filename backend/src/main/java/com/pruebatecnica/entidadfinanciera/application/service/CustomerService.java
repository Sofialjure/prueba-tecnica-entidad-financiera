package com.pruebatecnica.entidadfinanciera.application.service;

import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceConflictException;
import com.pruebatecnica.entidadfinanciera.domain.exception.ResourceNotFoundException;
import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.CustomerData;
import com.pruebatecnica.entidadfinanciera.domain.port.in.CreateCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.DeleteCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.GetCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.in.UpdateCustomerUseCase;
import com.pruebatecnica.entidadfinanciera.domain.port.out.CustomerRepositoryPort;
import java.time.Clock;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CustomerService
        implements CreateCustomerUseCase, GetCustomerUseCase, UpdateCustomerUseCase, DeleteCustomerUseCase {

    private final CustomerRepositoryPort customerRepository;
    private final Clock clock;

    public CustomerService(CustomerRepositoryPort customerRepository, Clock clock) {
        this.customerRepository = customerRepository;
        this.clock = clock;
    }

    @Override
    public Customer create(CustomerData data) {
        if (customerRepository.existsByIdentification(data.identificationType(), data.identificationNumber().strip())) {
            throw duplicatedIdentification(data);
        }
        return customerRepository.save(Customer.create(data, clock));
    }

    @Override
    @Transactional(readOnly = true)
    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el cliente con id " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Customer> getAll() {
        return customerRepository.findAll();
    }

    @Override
    public Customer update(Long id, CustomerData data) {
        Customer customer = getById(id);
        if (customerRepository.existsByIdentificationExcludingId(
                data.identificationType(), data.identificationNumber().strip(), id)) {
            throw duplicatedIdentification(data);
        }
        customer.update(data, clock);
        return customerRepository.save(customer);
    }

    @Override
    public void delete(Long id) {
        getById(id);
        if (customerRepository.hasAccounts(id)) {
            throw new ResourceConflictException(
                    "El cliente con id " + id + " tiene productos vinculados y no se puede eliminar");
        }
        customerRepository.deleteById(id);
    }

    private static ResourceConflictException duplicatedIdentification(CustomerData data) {
        return new ResourceConflictException("Ya existe un cliente con identificación "
                + data.identificationType() + " " + data.identificationNumber().strip());
    }
}
