package com.sugai.brix.product.service;

import com.sugai.brix.product.dto.ProductSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PopularProductService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProductService productService;

    private static final String CACHE_KEY = "popular:products";

    // ✅ Redis에 인기 상품 Top 5 저장 (24시간마다 재설정)
    public void updatePopularProductCache() {
        List<ProductSummaryDto> popularProducts = productService.getTop5PopularProducts();
        redisTemplate.opsForValue().set(CACHE_KEY, popularProducts, Duration.ofHours(24));
    }

    // ✅ Redis에서 인기 상품 조회
    public List<ProductSummaryDto> getCachedPopularProducts() {
        Object cached = redisTemplate.opsForValue().get(CACHE_KEY);
        if (cached instanceof List<?> list) {
            return list.stream()
                    .filter(o -> o instanceof ProductSummaryDto)
                    .map(o -> (ProductSummaryDto) o)
                    .toList();
        }
        return null;
    }
}

