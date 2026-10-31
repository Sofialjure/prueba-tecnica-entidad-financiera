package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import java.util.List;

public interface GetCustomerUseCase {

    Customer getById(Long id);

    List<Customer> getAll();
}
