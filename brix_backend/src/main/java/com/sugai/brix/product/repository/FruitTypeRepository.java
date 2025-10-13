package com.sugai.brix.product.repository;

import com.sugai.brix.product.entity.FruitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FruitTypeRepository extends JpaRepository<FruitType, Long> {
    // List<FruitType> findAll(); // 전체 과일 품목 조회

    // Optional<FruitType> findById(Long id); // ID로 조회
}
