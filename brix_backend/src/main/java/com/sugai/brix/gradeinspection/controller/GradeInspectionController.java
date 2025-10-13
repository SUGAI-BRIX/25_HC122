package com.sugai.brix.gradeinspection.controller;

import com.sugai.brix.common.exception.CustomException;
import com.sugai.brix.gradeinspection.dto.GradeInspectionRequest;
import com.sugai.brix.gradeinspection.service.GradeInspectionService;
import com.sugai.brix.product.entity.FruitType;
import com.sugai.brix.product.repository.FruitTypeRepository;
import com.sugai.brix.user.dto.CommonResponse;
import com.sugai.brix.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/inspections")
@RequiredArgsConstructor
public class GradeInspectionController {

    private final GradeInspectionService inspectionService;
    private final FruitTypeRepository fruitTypeRepository;

    @PostMapping
    public ResponseEntity<CommonResponse<Void>> submitInspection(
            @RequestBody GradeInspectionRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "인증된 사용자가 없습니다.");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof User)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "유효한 사용자 정보가 아닙니다.");
        }

        User seller = (User) principal;

        inspectionService.saveInspection(seller, request);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("검사 결과가 저장되었습니다.")
                        .data(null)
                        .build()
        );
    }

    // 사용자의 등급별 토큰 개수를 조회하는 API
    @GetMapping("/token-count")
    public ResponseEntity<CommonResponse<Map<String, Integer>>> getTokenCount(
            Authentication authentication,
            @RequestParam Long fruitTypeId  // 과일 종류 ID를 URL 파라미터로 받음
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "인증된 사용자가 없습니다.");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof User)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "유효한 사용자 정보가 아닙니다.");
        }

        User seller = (User) principal;

        // FruitType 객체를 fruitTypeId로 조회
        FruitType fruitType = fruitTypeRepository.findById(fruitTypeId)
                .orElseThrow(() -> new RuntimeException("Invalid fruitTypeId"));

        // 사용자의 등급별 토큰 수를 반환
        Map<String, Integer> tokenCounts = inspectionService.getTokenCountForUser(seller, fruitType);

        return ResponseEntity.ok(
                CommonResponse.<Map<String, Integer>>builder()
                        .status(200)
                        .message("사용자의 등급별 토큰 수")
                        .data(tokenCounts)
                        .build()
        );
    }

}
