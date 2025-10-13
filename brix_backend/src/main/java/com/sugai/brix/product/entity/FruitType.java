package com.sugai.brix.product.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class FruitType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // 과일 타입 ID (1 = 딸기, 2 = 사과, 3 = 바나나, 4 = 참외, 5 = 키위)

    @Column(nullable = false, unique = true)
    private String name;  // 과일 이름 (딸기, 사과, 바나나, 참외, 키위)
}