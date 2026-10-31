package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.mapper;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.AccountEntity;
import org.mapstruct.Mapper;

@Mapper
public interface AccountPersistenceMapper {

    AccountEntity toEntity(Account account);

    Account toDomain(AccountEntity entity);
}
