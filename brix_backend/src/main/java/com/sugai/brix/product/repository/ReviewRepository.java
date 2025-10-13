package com.sugai.brix.product.repository;

import com.sugai.brix.product.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 📦 특정 상품에 달린 모든 리뷰 조회
    List<Review> findAllByProduct_Id(Long productId);

    // 🧑‍💻 특정 사용자가 쓴 모든 리뷰 조회
    List<Review> findAllByWriter_Id(Long userId);

    // ⭐ 별점 높은 순으로 상품 리뷰 정렬
    List<Review> findAllByProduct_IdOrderByRatingDesc(Long productId);

    // 🕓 최신 순 정렬
    List<Review> findAllByProduct_IdOrderByIdDesc(Long productId);

    // ✅ 특정 유저가 특정 상품에 이미 리뷰를 작성했는지 확인
    boolean existsByProduct_IdAndWriter_Id(Long productId, Long writerId);
}
