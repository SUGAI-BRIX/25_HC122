package com.sugai.brix.product.entity;


import com.sugai.brix.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String content;     //리뷰 내용

    @Column(nullable = false)
    private int rating;         //별점

    //리뷰 사진은 추후에 시간 남으면 넣을게요

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false) // FK 설정, 리뷰 작성자
    private User writer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false) // FK 설정, 리뷰 대상 상품
    private Product product;


}
