package com.sugai.brix.product.repository;

import com.sugai.brix.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 🔍 과일 품목 기준 상품 조회 (FruitType.name)
    List<Product> findAllByFruitType_Name(String fruitName);

    // 🔍 과일 + 등급 포함 조건 검색 (예: 딸기 & S 등급 포함)
    //List<Product> findAllByFruitType_NameAndGradeContaining(String fruitName, String grade);

    // 🔍 가격 범위 검색 (ex: 10000~20000원)
    //List<Product> findAllByPriceBetween(int minPrice, int maxPrice);

    // 🔍 제목 키워드 포함 상품 검색
    List<Product> findAllByTitleContaining(String keyword);

    // 🧑‍🌾 판매자 ID로 등록한 상품 모두 조회
    //List<Product> findAllBySeller_Id(Long sellerId);

    // 글제목 + 과일 종류 and 메서드
    List<Product> findAllByTitleContainingAndFruitType_Name(String title, String fruitName);



    //임시
    // ✅ 제목에 특정 키워드가 포함되고, 과일명과 등급이 모두 일치하는 상품 조회
    List<Product> findAllByTitleContainingAndFruitType_NameAndGrade(String title, String fruitName, String grade);


    // ✅ 제목에 특정 키워드가 포함되고, 등급이 일치하는 상품 조회
    List<Product> findAllByTitleContainingAndGrade(String title, String grade);

    // ✅ 과일명과 등급이 모두 일치하는 상품 조회
    List<Product> findAllByFruitType_NameAndGrade(String fruitName, String grade);

    // ✅ 등급이 일치하는 상품 조회
    List<Product> findAllByGrade(String grade);

    // 리뷰의 평균 평점이 4점 이상인 글에서 내림차순으로 상품글 5개 가져오기
    @Query("SELECT p FROM Product p " +
            "JOIN p.reviews r " +
            "GROUP BY p.id " +
            "HAVING AVG(r.rating) >= 4 " + // 평균 별점이 4.0 이상인 상품만 필터링
            "ORDER BY COUNT(r.id) DESC") // 리뷰 수 많은 순으로 정렬
    Page<Product> findTop5ByAverageRating(Pageable pageable);
}