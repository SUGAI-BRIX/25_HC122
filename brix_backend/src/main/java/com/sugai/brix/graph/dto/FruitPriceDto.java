package com.sugai.brix.graph.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class FruitPriceDto {
    private LocalDate date;  // 날짜
    private int price;       // 가격
}
