package com.sugai.brix.product.repository;

import com.sugai.brix.product.entity.FruitGradePrice;
import com.sugai.brix.product.entity.FruitType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FruitGradePriceRepository extends JpaRepository<FruitGradePrice, Long> {
    Optional<FruitGradePrice> findByFruitTypeAndGrade(FruitType fruitType, String grade);
}
