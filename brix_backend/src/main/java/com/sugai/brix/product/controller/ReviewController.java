package com.sugai.brix.product.controller;

import com.sugai.brix.product.dto.ReviewDto;
import com.sugai.brix.product.service.ReviewService;
import com.sugai.brix.user.dto.CommonResponse;
import com.sugai.brix.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ReviewController {

    private final ReviewService reviewService;

    // 리뷰 조회
    @GetMapping("/{productId}/reviews")
    public ResponseEntity<CommonResponse<List<ReviewDto>>> getReviews(@PathVariable Long productId) {
        List<ReviewDto> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(
                CommonResponse.<List<ReviewDto>>builder()
                        .status(200)
                        .message("리뷰 조회 성공")
                        .data(reviews)
                        .build()
        );
    }

    // 리뷰 등록
    @PostMapping("/{productId}/reviews")
    public ResponseEntity<CommonResponse<Void>> createReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal User writer,  // ✅ 인증된 사용자 정보
            @RequestBody ReviewDto reviewDto) {

        reviewService.createReview(productId, writer, reviewDto);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("리뷰 등록 성공")
                        .build()
        );
    }

    // 리뷰 삭제
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<CommonResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal User currentUser  // 인증된 사용자
    ) {
        reviewService.deleteReview(reviewId, currentUser);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("리뷰 삭제 성공")
                        .build()
        );
    }
}
