package com.sugai.brix.user.service;

import com.sugai.brix.common.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final StringRedisTemplate redisTemplate;

    private static final long REFRESH_TOKEN_EXPIRATION_DAYS = 7;

    public void saveRefreshToken(String username, String refreshToken) {
        redisTemplate.opsForValue().set(
                username,
                refreshToken,
                REFRESH_TOKEN_EXPIRATION_DAYS,
                TimeUnit.DAYS
        );
    }

    public String getRefreshToken(String username) {
        //return redisTemplate.opsForValue().get(username);
        try {
            String token = redisTemplate.opsForValue().get(username);
            System.out.println("Redis에서 가져온 토큰: " + token);
            return token;
        } catch (Exception e) {
            System.out.println("Redis 연결 중 예외 발생:");
            e.printStackTrace(); // 진짜 예외 출력
            throw new CustomException(HttpStatus.BAD_REQUEST, "Unable to connect to Redis");
        }
    }

    public void deleteRefreshToken(String username) {
        redisTemplate.delete(username);
    }
}
