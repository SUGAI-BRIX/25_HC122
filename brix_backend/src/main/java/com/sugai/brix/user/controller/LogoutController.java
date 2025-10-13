package com.sugai.brix.user.controller;

import com.sugai.brix.user.dto.CommonResponse;
import com.sugai.brix.user.entity.User;
import com.sugai.brix.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class LogoutController {

    private final UserService userService;
    /*
    @PostMapping("/logout")
    public ResponseEntity<CommonResponse<Void>> logout() {
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("로그아웃이 완료되었습니다.")  // 메시지 수정
                        .data(null)
                        .build()
        );
    }

     */

    @DeleteMapping("/logout")
    public ResponseEntity<CommonResponse<Void>> logout(@AuthenticationPrincipal User user) {
        userService.logout(user.getUsername());

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("로그아웃 성공: 리프레시 토큰 삭제됨")
                        .data(null)
                        .build()
        );
    }


}
