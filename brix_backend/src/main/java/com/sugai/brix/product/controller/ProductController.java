package com.sugai.brix.product.controller;

import com.sugai.brix.product.dto.*;
import com.sugai.brix.product.service.PopularProductService;
import com.sugai.brix.product.service.ProductService;
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
public class ProductController {

    private final ProductService productService;
    private final PopularProductService popularProductService;

    // 과일 품목 목록 조회
    @GetMapping("/fruit-types")
    public ResponseEntity<CommonResponse<List<FruitTypeDto>>> getFruitTypes() {
        List<FruitTypeDto> result = productService.getFruitTypes();

        return ResponseEntity.ok(
                CommonResponse.<List<FruitTypeDto>>builder()
                        .status(200)
                        .message("과일 목록 조회 성공")
                        .data(result)
                        .build()
        );
    }


    // GET /products/search?fruitName=딸기    -> 특정 글들(ex.딸기)만 조회(과일 명 기준)
    // GET /products/search                  -> 전체 글 조회
    // GET /products/search?grade=S          -> 등급 기준 조회
    @GetMapping("/search")
    public ResponseEntity<CommonResponse<List<ProductSummaryDto>>> search(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String fruitName,
            @RequestParam(required = false) String grade
    ) {
        List<ProductSummaryDto> results = productService.search(title, fruitName, grade);

        return ResponseEntity.ok(
                CommonResponse.<List<ProductSummaryDto>>builder()
                        .status(200)
                        .message("상품 목록 조회 성공")
                        .data(results)
                        .build()
        );
    }

    //글 상세조회
    @GetMapping("/{productId}")
    public ResponseEntity<CommonResponse<ProductDetailDto>> getProductDetail(@PathVariable Long productId) {
        ProductDetailDto detail = productService.getProductDetail(productId);
        return ResponseEntity.ok(
                CommonResponse.<ProductDetailDto>builder()
                        .status(200)
                        .message("상품 상세 조회 성공")
                        .data(detail)
                        .build()
        );
    }

    // 판매할 과일의 상한가, 평균가, 하한가 조회
    @GetMapping("/estimate")
    public ResponseEntity<CommonResponse<PriceEstimateDto>> estimate(
            @RequestParam Long fruitTypeId,
            @RequestParam String grade,
            @RequestParam int quantity
    ) {
        PriceEstimateDto result = productService.estimatePrice(fruitTypeId, grade, quantity);
        return ResponseEntity.ok(
                CommonResponse.<PriceEstimateDto>builder()
                        .status(200)
                        .message("가격 범위 계산 성공")
                        .data(result)
                        .build()
        );
    }

    // 상품 등록
    @PostMapping
    public ResponseEntity<CommonResponse<String>> createProduct(
            @ModelAttribute ProductCreateRequest request,
            @AuthenticationPrincipal User seller
    ) {
        productService.createProduct(request, seller);
        return ResponseEntity.ok(CommonResponse.<String>builder()
                .status(200)
                .message("상품 등록 성공")
                .data("OK")
                .build());
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<CommonResponse<Void>> deleteProduct(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user
    ) {
        productService.deleteProduct(productId, user);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("상품 삭제 성공")
                        .data(null)
                        .build()
        );
    }

    @GetMapping("/popular")
    public ResponseEntity<CommonResponse<List<ProductSummaryDto>>> getPopularProducts() {
        List<ProductSummaryDto> cached = popularProductService.getCachedPopularProducts();

        List<ProductSummaryDto> result = (cached != null && !cached.isEmpty())
                ? cached
                : productService.getTop5PopularProducts();  // fallback (캐시 없을 때 DB에서 조회)

        return ResponseEntity.ok(
                CommonResponse.<List<ProductSummaryDto>>builder()
                        .status(200)
                        .message("인기 판매글 조회 성공")
                        .data(result)
                        .build()
        );
    }
}
