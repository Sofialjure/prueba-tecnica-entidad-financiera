package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository;

import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.AccountEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {

    List<AccountEntity> findByCustomerIdOrderById(Long customerId);

    @Query(value = "SELECT nextval('savings_account_number_seq')", nativeQuery = true)
    long nextSavingsNumber();

    @Query(value = "SELECT nextval('checking_account_number_seq')", nativeQuery = true)
    long nextCheckingNumber();
}
