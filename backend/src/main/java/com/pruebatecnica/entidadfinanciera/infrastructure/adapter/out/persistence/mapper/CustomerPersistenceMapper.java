package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper;

import com.pruebatecnica.entidadfinanciera.domain.model.Customer;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.CustomerEntity;
import org.mapstruct.Mapper;

@Mapper
public interface CustomerPersistenceMapper {

    CustomerEntity toEntity(Customer customer);

    Customer toDomain(CustomerEntity entity);
}
