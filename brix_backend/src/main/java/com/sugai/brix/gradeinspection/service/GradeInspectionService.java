package com.sugai.brix.gradeinspection.service;

import com.sugai.brix.gradeinspection.dto.GradeInspectionRequest;
import com.sugai.brix.gradeinspection.entity.GradeInspectionResult;
import com.sugai.brix.gradeinspection.repository.GradeInspectionResultRepository;
import com.sugai.brix.product.entity.FruitType;
import com.sugai.brix.product.repository.FruitTypeRepository;
import com.sugai.brix.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GradeInspectionService {

    private final GradeInspectionResultRepository inspectionRepo;
    private final FruitTypeRepository fruitTypeRepo;

    public void saveInspection(User seller, GradeInspectionRequest request) {
        FruitType fruitType = fruitTypeRepo.findById(request.getFruitTypeId())
                .orElseThrow(() -> new RuntimeException("Invalid fruitTypeId"));

        Map<String, Integer> counts = request.getCounts();

        // (seller, fruitType) 조합으로 기존 결과 찾기
        GradeInspectionResult result = inspectionRepo.findBySellerAndFruitType(seller, fruitType)
                .orElseGet(() -> {
                    GradeInspectionResult newResult = new GradeInspectionResult();
                    newResult.setSeller(seller);
                    newResult.setFruitType(fruitType);
                    newResult.setInspectedAt(LocalDateTime.now());
                    return newResult;
                });

        // 누적 저장 (기존 값 + 신규 값)
        result.setCountS(result.getCountS() + counts.getOrDefault("S", 0));
        result.setCountA(result.getCountA() + counts.getOrDefault("A", 0));
        result.setCountB(result.getCountB() + counts.getOrDefault("B", 0));
        result.setCountC(result.getCountC() + counts.getOrDefault("C", 0));

        result.setInspectedAt(LocalDateTime.now()); // 검사 일시 갱신

        inspectionRepo.save(result);
    }
    // 사용자의 등급별 토큰 수를 반환
    public Map<String, Integer> getTokenCountForUser(User seller, FruitType fruitType) {
        Map<String, Integer> tokenCounts = new HashMap<>();

        // 사용자의 검사 결과를 가져옴
        GradeInspectionResult result = inspectionRepo.findBySellerAndFruitType(seller, fruitType)
                .orElseThrow(() -> new RuntimeException("검사 결과가 존재하지 않습니다."));

        tokenCounts.put("S", result.getCountS());
        tokenCounts.put("A", result.getCountA());
        tokenCounts.put("B", result.getCountB());
        tokenCounts.put("C", result.getCountC());

        return tokenCounts;
    }


}
