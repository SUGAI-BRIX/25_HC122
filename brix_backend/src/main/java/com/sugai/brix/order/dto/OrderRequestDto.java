package com.sugai.brix.order.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderRequestDto {
    private Long productId;  // 주문할 상품 ID
    private int quantity;    // 주문 수량
    private String deliveryAddress; // 배송지 주소
}