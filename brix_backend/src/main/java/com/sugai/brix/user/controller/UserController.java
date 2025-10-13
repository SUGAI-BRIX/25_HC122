/* userdetails버전
package com.sugai.brix.controller;


import com.sugai.brix.dto.UpdatePasswordRequest;
import com.sugai.brix.dto.UpdateUserRequest;
import com.sugai.brix.dto.UserInfoResponse;
import com.sugai.brix.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// controller/UserController.java
@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        UserInfoResponse response = userService.getMyInfo(username);
        return ResponseEntity.ok(response);
    }
    // 유저 정보 수정

    @PutMapping("/me")
    public ResponseEntity<String> updateMyInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid UpdateUserRequest request
    ) {
        String username = userDetails.getUsername();
        userService.updateMyInfo(username, request);
        return ResponseEntity.ok("사용자 정보가 성공적으로 수정되었습니다.");
    }

    // 비밀번호 변경

    @PutMapping("/password")
    public ResponseEntity<String> updatePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid UpdatePasswordRequest request
    ) {
        String username = userDetails.getUsername();
        userService.updatePassword(username, request);
        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
    }

    // 회원 탈퇴

    @DeleteMapping("/me")
    public ResponseEntity<String> deleteMyAccount(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String username = userDetails.getUsername();
        userService.deleteUser(username);
        return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
    }



}
*/
/*commonResponse 수정 전

package com.sugai.brix.controller;

import com.sugai.brix.dto.UpdatePasswordRequest;
import com.sugai.brix.dto.UpdateUserRequest;
import com.sugai.brix.dto.UserInfoResponse;
import com.sugai.brix.entity.User; // User import 추가!
import com.sugai.brix.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;


    //사용자 정보 불러오기 테스트 완료
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getMyInfo(@AuthenticationPrincipal User user) {
        String username = user.getUsername();
        UserInfoResponse response = userService.getMyInfo(username);
        return ResponseEntity.ok(response);
    }


    //사용자 정보 수정 email, nickname  테스트 완료
    @PutMapping("/me")
    public ResponseEntity<String> updateMyInfo(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateUserRequest request
    ) {
        String username = user.getUsername();
        userService.updateMyInfo(username, request);
        return ResponseEntity.ok("사용자 정보가 성공적으로 수정되었습니다.");
    }

    //비밀번호 변경
    @PutMapping("/password")
    public ResponseEntity<String> updatePassword(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdatePasswordRequest request
    ) {
        String username = user.getUsername();
        userService.updatePassword(username, request);
        return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
    }

    //회원 탈퇴
    @DeleteMapping("/me")
    public ResponseEntity<String> deleteMyAccount(
            @AuthenticationPrincipal User user
    ) {
        String username = user.getUsername();
        userService.deleteUser(username);
        return ResponseEntity.ok("회원 탈퇴가 완료되었습니다.");
    }
}
*/

package com.sugai.brix.user.controller;

import com.sugai.brix.user.dto.CommonResponse;
import com.sugai.brix.user.dto.UpdatePasswordRequest;
import com.sugai.brix.user.dto.UpdateUserRequest;
import com.sugai.brix.user.dto.UserInfoResponse;
import com.sugai.brix.user.entity.User;
import com.sugai.brix.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    // 사용자 정보 조회
    @GetMapping("/me")
    public ResponseEntity<CommonResponse<UserInfoResponse>> getMyInfo(@AuthenticationPrincipal User user) {
        String username = user.getUsername();
        UserInfoResponse response = userService.getMyInfo(username);
        return ResponseEntity.ok(
                CommonResponse.<UserInfoResponse>builder()
                        .status(200)
                        .message("사용자 정보 조회 성공")
                        .data(response)
                        .build()
        );
    }

    /*
    // 사용자 정보 수정
    @PutMapping("/me")
    public ResponseEntity<CommonResponse<Void>> updateMyInfo(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateUserRequest request
    ) {
        String username = user.getUsername();
        userService.updateMyInfo(username, request);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("사용자 정보가 성공적으로 수정되었습니다.")
                        .data(null)
                        .build()
        );
    }
    */

    //유저 정보 수정 이미지 추가 버전
    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommonResponse<Void>> updateMyInfo(
            @AuthenticationPrincipal User user,
            @RequestPart("request") @Valid UpdateUserRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage
    ) {
        String username = user.getUsername();
        userService.updateMyInfo(username, request, profileImage);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("사용자 정보가 성공적으로 수정되었습니다.")
                        .data(null)
                        .build()
        );
    }



    // 비밀번호 변경
    @PutMapping("/password")
    public ResponseEntity<CommonResponse<Void>> updatePassword(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdatePasswordRequest request
    ) {
        String username = user.getUsername();
        userService.updatePassword(username, request);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("비밀번호가 성공적으로 변경되었습니다.")
                        .data(null)
                        .build()
        );
    }

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ResponseEntity<CommonResponse<Void>> deleteMyAccount(
            @AuthenticationPrincipal User user
    ) {
        String username = user.getUsername();
        userService.deleteUser(username);
        return ResponseEntity.ok(
                CommonResponse.<Void>builder()
                        .status(200)
                        .message("회원 탈퇴가 완료되었습니다.")
                        .data(null)
                        .build()
        );
    }
}
