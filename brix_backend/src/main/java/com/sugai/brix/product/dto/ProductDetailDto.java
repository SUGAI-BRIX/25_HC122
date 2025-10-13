package com.sugai.brix.product.dto;

import com.sugai.brix.product.entity.Product;
import lombok.Builder;

import java.time.LocalDate;
import java.util.Map;

@Builder
public record ProductDetailDto(
        Long id,
        String title,
        String description,
        String grade,
        int price,
        int quantity,
        String productImageUrl,
        LocalDate expectedDeliveryDate,
        String sellerName,
        String fruitName,
        Map<String, Integer> gradeTokenMap
) {
    public static ProductDetailDto from(Product product) {
        return ProductDetailDto.builder()
                .id(product.getId())
                .title(product.getTitle())
                .description(product.getDescription())
                .grade(product.getGrade())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .productImageUrl(product.getProductImageUrl())
                .expectedDeliveryDate(product.getExpectedDeliveryDate())
                .sellerName(product.getSeller().getUsername())  // 또는 getNickname()
                .fruitName(product.getFruitType().getName())
                .gradeTokenMap(product.getGradeTokenMap())
                .build();
    }
}
