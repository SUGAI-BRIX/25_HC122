/*
package com.sugai.brix.email;

//package com.sugai.brix.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class EmailService {

    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public void sendCode(String email) {
        String code = String.format("%06d", random.nextInt(1000000));
        verificationCodes.put(email, code);

        // 실제 이메일 전송이 구현되어 있다면 아래를 사용
        // emailSender.send(email, "비밀번호 재설정 인증번호", "인증번호는 " + code + " 입니다.");

        log.info("인증번호 [{}] 가 이메일 [{}] 로 전송됨 (mock)", code, email);
    }

    public boolean verifyCode(String email, String code) {
        return code != null && code.equals(verificationCodes.get(email));
    }

    public void clearCode(String email) {
        verificationCodes.remove(email);
    }
}
*/

/*
package com.sugai.brix.email;

//package com.sugai.brix.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();

    public void sendCode(String email) {
        String code = generateCode();
        verificationCodes.put(email, code);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("비밀번호 재설정 인증번호");
        message.setText("인증번호는 다음과 같습니다: " + code);

        mailSender.send(message);
    }

    public boolean verifyCode(String email, String code) {
        return code.equals(verificationCodes.get(email));
    }

    public void clearCode(String email) {
        verificationCodes.remove(email);
    }

    private String generateCode() {
        return String.valueOf(new Random().nextInt(899999) + 100000); // 6자리 숫자
    }
}
*/

/*인증번호 만료 시간 버전
package com.sugai.brix.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // 인증번호 + 만료시간을 담는 구조
    private static class VerificationInfo {
        private final String code;
        private final long expiresAt;

        public VerificationInfo(String code, long expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }

        public String getCode() {
            return code;
        }

        public long getExpiresAt() {
            return expiresAt;
        }
    }

    private final Map<String, VerificationInfo> verificationCodes = new ConcurrentHashMap<>();

    public void sendCode(String email) {
        String code = generateCode();
        long expiresAt = System.currentTimeMillis() + (5 * 60 * 1000); // 5분

        verificationCodes.put(email, new VerificationInfo(code, expiresAt));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("비밀번호 재설정 인증번호");
        message.setText("인증번호는 다음과 같습니다: " + code + "\n\n유효시간: 5분");

        mailSender.send(message);
    }

    public boolean verifyCode(String email, String code) {
        VerificationInfo info = verificationCodes.get(email);

        if (info == null) return false;

        // 유효기간 검사
        if (System.currentTimeMillis() > info.getExpiresAt()) {
            verificationCodes.remove(email); // 만료된 코드 제거
            return false;
        }

        return code.equals(info.getCode());
    }

    public void clearCode(String email) {
        verificationCodes.remove(email);
    }

    private String generateCode() {
        return String.valueOf(new Random().nextInt(899999) + 100000); // 6자리 숫자
    }
}

 */

//인증번호 만료시간 + 로컬 메모리가 아닌 redis에 저장하도록 변경한 버전
package com.sugai.brix.email.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final StringRedisTemplate redisTemplate;

    private static final long EXPIRE_MINUTES = 5;

    public void sendCode(String email) {
        String code = generateCode();

        // Redis에 저장 + 유효시간 5분 설정
        redisTemplate.opsForValue().set(email, code, EXPIRE_MINUTES, TimeUnit.MINUTES);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("비밀번호 재설정 인증번호");
        message.setText("인증번호는 다음과 같습니다: " + code + "\n\n유효시간: " + EXPIRE_MINUTES + "분");

        mailSender.send(message);
    }

    public boolean verifyCode(String email, String code) {
        String storedCode = redisTemplate.opsForValue().get(email);

        // 저장된 코드가 없거나 다르면 false
        return code.equals(storedCode);
    }

    public void clearCode(String email) {
        redisTemplate.delete(email);
    }

    private String generateCode() {
        return String.valueOf(new Random().nextInt(899999) + 100000); // 6자리 숫자
    }
}
