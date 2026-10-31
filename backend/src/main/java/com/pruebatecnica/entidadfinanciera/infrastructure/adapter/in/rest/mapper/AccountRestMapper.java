package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.mapper;

import com.pruebatecnica.entidadfinanciera.domain.model.Account;
import com.pruebatecnica.entidadfinanciera.domain.model.OpenAccountData;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.AccountRequest;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.in.rest.dto.AccountResponse;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface AccountRestMapper {

    @Mapping(target = "gmfExempt", defaultValue = "false")
    OpenAccountData toData(AccountRequest request);

    AccountResponse toResponse(Account account);

    List<AccountResponse> toResponses(List<Account> accounts);
}
