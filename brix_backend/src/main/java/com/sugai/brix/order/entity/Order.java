package com.sugai.brix.order.entity;

import com.sugai.brix.product.entity.Product;
import com.sugai.brix.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="orders")
@Getter
@Setter
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false) // 외래키: user 테이블의 id 참조
    private User buyer;

    @ManyToOne
    private Product product; // 구매 상품

    private int quantity; // 수량

    @Enumerated(EnumType.STRING)
    private OrderStatus status; // 주문 상태

    private LocalDateTime orderDate; // 주문일

    private String deliveryAddress; // 배송지 주소

    private LocalDate expectedDeliveryDate; // 예상 배송일
}

