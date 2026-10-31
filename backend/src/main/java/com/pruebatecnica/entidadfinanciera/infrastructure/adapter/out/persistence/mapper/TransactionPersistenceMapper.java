package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper;

import com.pruebatecnica.entidadfinanciera.domain.model.Transaction;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.TransactionEntity;
import org.mapstruct.Mapper;

@Mapper
public interface TransactionPersistenceMapper {

    TransactionEntity toEntity(Transaction transaction);

    Transaction toDomain(TransactionEntity entity);
}
