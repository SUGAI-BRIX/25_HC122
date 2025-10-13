package com.sugai.brix.email.controller;

import com.sugai.brix.email.service.EmailService;
import com.sugai.brix.user.dto.CommonResponse;
import com.sugai.brix.user.dto.EmailCodeRequest;
import com.sugai.brix.user.dto.EmailVerifyRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/email")
public class EmailController {

    private final EmailService emailService;

    //인증번호 발송 요청
    @PostMapping("/sendCode")
    public ResponseEntity<CommonResponse<String>> sendCode(@RequestBody EmailCodeRequest request) {
        emailService.sendCode(request.getEmail());
        return ResponseEntity.ok(
                CommonResponse.<String>builder()
                        .status(200)
                        .message("인증번호가 전송되었습니다.")
                        .data("OK")
                        .build()
        );
    }

    //인증번호 검증 요청
    @PostMapping("/verifyCode")
    public ResponseEntity<CommonResponse<Boolean>> verifyCode(@RequestBody EmailVerifyRequest request) {
        boolean result = emailService.verifyCode(request.getEmail(), request.getCode());
        String message = result ? "인증번호가 확인되었습니다." : "인증번호가 일치하지 않거나 만료되었습니다.";
        return ResponseEntity.ok(
                CommonResponse.<Boolean>builder()
                        .status(200)
                        .message(message)
                        .data(result)
                        .build()
        );
    }
}
