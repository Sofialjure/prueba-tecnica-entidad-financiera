package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository;

import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.AccountEntity;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {

    List<AccountEntity> findByCustomerIdOrderById(Long customerId);

    /** SELECT ... FOR UPDATE */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AccountEntity a WHERE a.id = :id")
    Optional<AccountEntity> findByIdForUpdate(@Param("id") Long id);

    /** SELECT ... ORDER BY id FOR UPDATE: PostgreSQL locks the rows in the sorted order. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AccountEntity a WHERE a.accountNumber IN :accountNumbers ORDER BY a.id")
    List<AccountEntity> findByAccountNumbersForUpdate(@Param("accountNumbers") Collection<String> accountNumbers);

    @Query(value = "SELECT nextval('savings_account_number_seq')", nativeQuery = true)
    long nextSavingsNumber();

    @Query(value = "SELECT nextval('checking_account_number_seq')", nativeQuery = true)
    long nextCheckingNumber();
}
