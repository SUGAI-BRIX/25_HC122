/* commonResponse 수정 전 버전
package com.sugai.brix.controller;

import com.sugai.brix.dto.JwtResponse;
import com.sugai.brix.dto.LoginRequest;
import com.sugai.brix.dto.ResetPasswordRequest;
import com.sugai.brix.dto.SignupRequest;
import com.sugai.brix.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    //회원가입 테스트 완료 -> response수정 필요
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody @Valid SignupRequest request) {
        userService.signup(request);
        return ResponseEntity.ok("회원가입이 완료되었습니다.");//바디에 담는게 아니라 json으로 보내야함 respons 파일을 만들어서 message : ~ 로 나오게 바꿔야함 이런구조 전부
    }

    //로그인 + 토큰 ? 테스트 완료
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody @Valid LoginRequest request) {
        JwtResponse token = userService.login(request);
        return ResponseEntity.ok(token);//로그인 response를 만들어서 보내야하는듯 -> 아님 걍 이대로 해도 됨
    }

    // 비밀번호 재설정 테스트 완료

    @PostMapping("/resetPassword")
    public ResponseEntity<String> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
    }


}
*/

package com.sugai.brix.user.controller;

import com.sugai.brix.email.service.EmailService;
import com.sugai.brix.user.service.UserService;
import com.sugai.brix.user.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final EmailService emailService;

    /*프로필 사진 없는 버전
    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<CommonResponse<Void>> signup(@RequestBody @Valid SignupRequest request) {
        userService.signup(request);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("회원가입이 완료되었습니다.")
                        .data(null)
                        .build()
        );
    }
    */

    //회원가입, 프로필 사진 기능 추가
    @PostMapping(value = "/signup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommonResponse<Void>> signup(
            @RequestPart("request") @Valid SignupRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        userService.signup(request, profileImage);

        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("회원가입이 완료되었습니다.")
                        .data(null)
                        .build()
        );
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<CommonResponse<JwtResponse>> login(@RequestBody @Valid LoginRequest request) {
        JwtResponse token = userService.login(request);
        return ResponseEntity.ok(
                CommonResponse.<JwtResponse>builder()
                        .status(200)
                        .message("로그인 성공")
                        .data(token)
                        .build()
        );
    }


    /*
    // 비밀번호 재설정
    @PostMapping("/resetPassword")
    public ResponseEntity<CommonResponse<Void>> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        userService.resetPassword(request);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("비밀번호가 성공적으로 변경되었습니다.")
                        .data(null)
                        .build()
        );
    }

     */

    //이메일 인증 방식의 비밀번호 재설정
    @PostMapping("/resetPassword")
    public ResponseEntity<CommonResponse<String>> resetPassword(@RequestBody @Valid ResetPasswordByEmailRequest request) {
        if (emailService.verifyCode(request.getEmail(), request.getCode())) {
            userService.resetPasswordByEmail(request.getEmail(), request.getNewPassword());
            emailService.clearCode(request.getEmail());
            return ResponseEntity.ok(
                    CommonResponse.<String>builder()
                            .status(200)
                            .message("비밀번호 변경 성공")
                            .data(null)
                            .build()
            );
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    CommonResponse.<String>builder()
                            .status(400)
                            .message("인증번호가 일치하지 않습니다.")
                            .data(null)
                            .build()
            );
        }
    }


    //refresh토큰을 활용한 access 토큰 재발급
    @PostMapping("/reissue")
    public ResponseEntity<CommonResponse<JwtResponse>> reissue(@RequestBody @Valid ReissueRequest request) {
        JwtResponse response = userService.reissueAccessToken(request.getRefreshToken());

        return ResponseEntity.ok(
                CommonResponse.<JwtResponse>builder()
                        .status(200)
                        .message("토큰 재발급 성공")
                        .data(response)
                        .build()
        );
    }




}
