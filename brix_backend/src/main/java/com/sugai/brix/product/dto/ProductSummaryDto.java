package com.sugai.brix.product.dto;

import com.sugai.brix.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class ProductSummaryDto {
    private Long id;
    private String title;
    private int price;
    private String grade;
    private String sellerNickname;
    private String productImageUrl;
    private LocalDate expectedDeliveryDate;

    public static ProductSummaryDto from(Product product) {
        return new ProductSummaryDto(
                product.getId(),
                product.getTitle(),
                product.getPrice(),
                product.getGrade(),
                product.getSeller().getNickname(),
                product.getProductImageUrl(),
                product.getExpectedDeliveryDate()
        );
    }
}
