package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.domain.model.CustomerData;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.CustomerRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.CustomerResponse;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper
public interface CustomerRestMapper {

    CustomerData toData(CustomerRequest request);

    CustomerResponse toResponse(Customer customer);

    List<CustomerResponse> toResponses(List<Customer> customers);
}
