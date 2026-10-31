package com.pruebatecnica.entidadfinanciera.domain.port.in;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.CustomerData;

public interface CreateCustomerUseCase {

    Customer create(CustomerData data);
}
