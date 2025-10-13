package com.sugai.brix.product.entity;

import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import com.sugai.brix.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Map;
@Getter
@Setter
@Entity
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  //키값

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fruit_type_id", nullable = false) // FK : fruit_type 테이블의 id (과일 종류)
    private FruitType fruitType; // 과일 타입 ID (1 = 딸기, 2 = 사과, 3 = 바나나, 4 = 참외, 5 = 키위)

    @Column(nullable = false)
    private String grade;   //과일 등급 (S, A, B), 판매 페이지에 판매 가능한 과일의 등급을 표시(예: 이 페이지에서 판매 가능한 과일은 S, A등급이 있습니다.)

    @Column(nullable = false)
    private int quantity; // 과일의 개수

    @Column(nullable = false)
    private int price;      //가격

    @Column(nullable = false)
    private String title;   //글 제목

    @Column(nullable = false)
    private String description;     // 글 내용


    //실제 판매 가능한 등급별 과일 개수를 위한 토큰
    @ElementCollection
    @CollectionTable(name = "product_grade_quantity", joinColumns = @JoinColumn(name = "product_id"))
    @MapKeyColumn(name = "grade") // S, A, B
    @Column(name = "quantity")    // 각 등급의 개수
    private Map<String, Integer> gradeTokenMap = new HashMap<>();

    @Column(name = "expected_delivery_date", nullable = true)
    private LocalDate expectedDeliveryDate;     //예상 배송일

    @Column(name = "product_image_url", nullable = true)    //제품 사진
    private String productImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false) // FK 설정
    private User seller;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @Column(nullable = false)
    private int reviewCount = 0; // 리뷰 수 (기본값 0) -> 인기글 조회 시 사용
}
