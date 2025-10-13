package com.sugai.brix.order.entity;

public enum OrderStatus {
    PENDING,    // 구매 요청 중
    APPROVED,   // 판매자 승인
    SHIPPED,    // 배송 시작
    DELIVERED,  // 배송 완료
    CANCELLED   // 취소됨
}

