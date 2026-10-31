package com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.repository;

import com.pruebatecnica.entidadfinanciera.infrastructure.adapter.out.persistence.entity.TransactionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionJpaRepository extends JpaRepository<TransactionEntity, Long> {

    /** Ids grow in the order movements are applied, so they break ties within the same second. */
    List<TransactionEntity> findByAccountIdOrderByCreatedAtDescIdDesc(Long accountId);
}
