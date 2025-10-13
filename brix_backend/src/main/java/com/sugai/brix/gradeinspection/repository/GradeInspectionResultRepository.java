package com.sugai.brix.gradeinspection.repository;

import com.sugai.brix.gradeinspection.entity.GradeInspectionResult;
import com.sugai.brix.product.entity.FruitType;
import com.sugai.brix.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeInspectionResultRepository extends JpaRepository<GradeInspectionResult, Long> {

    Optional<GradeInspectionResult> findBySellerAndFruitType(User seller, FruitType fruitType);
    // (선택) 특정 판매자의 최근 검사 결과 조회
    List<GradeInspectionResult> findBySellerOrderByInspectedAtDesc(User seller);

    // (선택) 판매자 + 과일 종류로 최근 검사 이력 조회
    List<GradeInspectionResult> findBySellerAndFruitTypeOrderByInspectedAtDesc(User seller, FruitType fruitType);


}
