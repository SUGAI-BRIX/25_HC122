package com.sugai.brix.product.dto;

public record PriceEstimateDto(
        String fruitName, // 과일 명
        String grade, // 등급
        int quantity, // 개수
        int minTotalPrice, // 하한가
        int avgTotalPrice, // 평균가
        int maxTotalPrice // 상한가
) { }
