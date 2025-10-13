package com.sugai.brix.product.dto;

/*
** what use record?? **
불변 객체 자동 생성 (setter 없음)

toString(), equals(), hashCode(), constructor 자동 생성됨

정말 간단한 데이터 전달용일 때 간결함 최고
 */
public record FruitTypeDto (Long id, String name){
}
