package com.sugai.brix.product.dto;


import com.sugai.brix.product.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReviewDto {
    private Long id;
    private String content;
    private int rating;
    private String writerNickname;

    public static ReviewDto from(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getContent(),
                review.getRating(),
                review.getWriter().getNickname() // User 엔티티에서 닉네임 가져오기
        );
    }
}
