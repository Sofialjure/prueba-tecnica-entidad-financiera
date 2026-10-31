package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository;

import com.pruebatecnica.entidadfinanciera.domain.model.IdentificationType;
import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerJpaRepository extends JpaRepository<CustomerEntity, Long> {

    boolean existsByIdentificationTypeAndIdentificationNumber(IdentificationType type, String number);

    boolean existsByIdentificationTypeAndIdentificationNumberAndIdNot(
            IdentificationType type, String number, Long id);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM accounts WHERE customer_id = :customerId)", nativeQuery = true)
    boolean hasAccounts(@Param("customerId") Long customerId);
}
