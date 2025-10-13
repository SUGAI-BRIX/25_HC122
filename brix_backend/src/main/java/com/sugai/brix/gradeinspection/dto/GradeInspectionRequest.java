package com.sugai.brix.gradeinspection.dto;

import lombok.Data;

import java.util.Map;

@Data
public class GradeInspectionRequest {
    private Long fruitTypeId;
    private Map<String, Integer> counts; // 예: { "S": 20, "A": 5, "B": 4, "C": 1 }
}
