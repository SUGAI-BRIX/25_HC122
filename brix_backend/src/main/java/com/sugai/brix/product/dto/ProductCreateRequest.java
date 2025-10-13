package com.sugai.brix.product.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Getter
@Setter
public class ProductCreateRequest {

    private Long fruitTypeId; // 과일 타입 ID
    private String grade; // S, A, B
    private int quantity;
    private int price;
    private String title;
    private String description;
    private LocalDate expectedDeliveryDate;
    private MultipartFile productImage; // 상품 등록 이미지 파일
}
