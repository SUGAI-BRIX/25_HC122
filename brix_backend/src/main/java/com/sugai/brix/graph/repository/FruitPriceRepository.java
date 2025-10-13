package com.sugai.brix.graph.repository;

import com.sugai.brix.graph.entity.FruitPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FruitPriceRepository extends JpaRepository<FruitPrice, Long> {

    // 특정 itemCode(과일 종류), quality(품질) 기준으로 기간 내 시세 조회 (프론트 전달용)
    List<FruitPrice> findByItemCodeAndQualityAndDateBetweenOrderByDateAsc(
            int itemCode,
            int quality,
            LocalDate startDate,
            LocalDate endDate
    );

    // 특정 날짜 이후 시세 조회 (예: 최근 6개월)
    List<FruitPrice> findByDateAfterOrderByDateAsc(LocalDate date);
}
