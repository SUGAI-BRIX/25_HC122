package com.sugai.brix.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class FruitGradePrice { // 과일 상하한가 제공용

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fruit_type_id", nullable = false)
    private FruitType fruitType; // 과일 종류

    @Column(nullable = false)
    private String grade; // 등급 (예: S, A, B)

    @Column(nullable = false)
    private int avgPrice; // 평균가

    @Column(nullable = false)
    private int minPrice; // 하한가

    @Column(nullable = false)
    private int maxPrice; // 상한가
}
