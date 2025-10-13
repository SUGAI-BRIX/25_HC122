package com.sugai.brix.product.service;


import com.sugai.brix.product.dto.ReviewDto;
import com.sugai.brix.product.entity.Product;
import com.sugai.brix.product.entity.Review;
import com.sugai.brix.product.repository.ProductRepository;
import com.sugai.brix.product.repository.ReviewRepository;
import com.sugai.brix.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public List<ReviewDto> getReviewsByProductId(Long productId) {
        List<Review> reviews = reviewRepository.findAllByProduct_Id(productId);
        return reviews.stream()
                .map(ReviewDto::from)
                .toList();

    }

    @Transactional
    public void createReview(Long productId, User writer, ReviewDto reviewDto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("해당 상품을 찾을 수 없습니다."));

        // 중복 리뷰 방지
        boolean exists = reviewRepository.existsByProduct_IdAndWriter_Id(productId, writer.getId());
        if (exists) {
            throw new IllegalStateException("이미 이 상품에 리뷰를 작성하셨습니다.");
        }

        Review review = new Review();
        review.setProduct(product);      // 해당 리뷰의 상품 설정
        review.setWriter(writer);          // 리뷰 작성자 설정
        review.setContent(reviewDto.getContent());
        review.setRating(reviewDto.getRating());

        reviewRepository.save(review);   // 리뷰 저장

        // 리뷰 수 증가
        product.setReviewCount(product.getReviewCount() + 1);
        productRepository.save(product);
    }

    @Transactional
    public void deleteReview(Long reviewId, User currentUser) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다."));

        // 작성자 본인인지 검증
        if (!review.getWriter().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("리뷰 삭제 권한이 없습니다.");
        }

        Product product = review.getProduct();

        // 리뷰 삭제
        reviewRepository.delete(review);

        // 리뷰 수 감소
        product.setReviewCount(Math.max(0, product.getReviewCount() - 1));
        productRepository.save(product);
    }
}
