package com.sugai.brix.graph.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
public class FruitPrice { // 과일 시세그래프 제공용

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;       // 딸기
    private String kindName;       // 딸기(1kg)
    private String marketName;     // 가락도매
    private String countyName;     // 서울, 평균, 평년
    private Integer price;         // 숫자형 가격
    private LocalDate date;        // yyyy + MM/dd 조합

    private Integer itemCode;      // 226
    private Integer quality;       // 1~4
}

