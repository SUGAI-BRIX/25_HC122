package com.sugai.brix.product.scheduler;

import com.sugai.brix.product.service.PopularProductService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PopularProductScheduler {

    private final PopularProductService cacheService;
    private final PopularProductService popularProductService;

    @PostConstruct
    public void initPopularCache() { // 서버 시작과 동시에 인기글을 redis 캐시에 1회 저장
        popularProductService.updatePopularProductCache();
    }

    // ⏰ 매일 새벽 3시 정각에 실행됨
    @Scheduled(cron = "0 0 3 * * *") // 새벽 3시마다 인기글 갱신
    public void refreshPopularProducts() {
        cacheService.updatePopularProductCache();
    }
}
