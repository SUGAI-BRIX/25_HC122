package com.sugai.brix.order.dto;

import com.sugai.brix.order.entity.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class OrderResponseDto {
    private Long productId; // 리뷰 API 호출에 필요한 상품 ID

    private Long orderId; // 주문 ID

    private String productTitle; // 상품 제목

    private int price; // 개당 가격

    private int quantity; // 주문 수량

    private int totalPrice; // 총 가격 (가격 * 수량)

    private OrderStatus status; // 주문 상태

    private LocalDateTime orderDate; // 주문일

    private String deliveryAddress; // 배송지

    private LocalDate expectedDeliveryDate; // 예상 배송일
}

