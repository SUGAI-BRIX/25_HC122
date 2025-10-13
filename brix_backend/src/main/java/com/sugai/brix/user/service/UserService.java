package com.sugai.brix.user.service;

import com.sugai.brix.user.entity.Role;
import com.sugai.brix.user.entity.User;
import com.sugai.brix.common.exception.CustomException; // 추가
import com.sugai.brix.user.repository.UserRepository;
import com.sugai.brix.common.s3.S3Service;
import com.sugai.brix.common.security.JwtProvider;
import com.sugai.brix.user.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus; // 추가
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final S3Service s3Service;
    private final RefreshTokenService refreshTokenService;


    /*
    // 회원가입
    public void signup(SignupRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            // throw new RuntimeException("이미 사용 중인 아이디입니다.");
            throw new CustomException(HttpStatus.BAD_REQUEST, "이미 사용 중인 아이디입니다."); // 수정
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            // throw new RuntimeException("이미 사용 중인 이메일입니다.");
            throw new CustomException(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다."); // 수정
        }

        // ADMIN 등록 방지
        if (request.getRole() == Role.ADMIN) {
            // throw new RuntimeException("관리자 계정은 생성할 수 없습니다.");
            throw new CustomException(HttpStatus.BAD_REQUEST, "관리자 계정은 생성할 수 없습니다."); // 수정
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .nickname(request.getNickname())
                .role(request.getRole())
                .build();

        userRepository.save(user);
    }

     */

    //회원가입 프로필 사진 버전
    public void signup(SignupRequest request, MultipartFile profileImage) {
        // 중복 체크
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "이미 사용 중인 아이디입니다.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다.");
        }
        if (request.getRole() == Role.ADMIN) {
            throw new CustomException(HttpStatus.BAD_REQUEST, "관리자 계정은 생성할 수 없습니다.");
        }

        // 프로필 이미지 업로드
        String profileImageUrl = null;
        if (profileImage != null && !profileImage.isEmpty()) {
            profileImageUrl = s3Service.upload(profileImage, "profiles");  // S3 업로드
        }

        // 유저 생성
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .nickname(request.getNickname())
                .role(request.getRole())
                .profileImageUrl(profileImageUrl)
                .build();

        userRepository.save(user);
    }


/*
    // 로그인
    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                // .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다."));
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "존재하지 않는 사용자입니다.")); // 수정

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // throw new RuntimeException("비밀번호가 일치하지 않습니다.");
            throw new CustomException(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다."); // 수정
        }

        String token = jwtProvider.createToken(user.getUsername());
        return new JwtResponse(token);
    }


 */

    //로그인, refresh token 추가 버전
    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new CustomException(HttpStatus.UNAUTHORIZED, "존재하지 않는 사용자입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtProvider.createAccessToken(user.getUsername());
        String refreshToken = jwtProvider.createRefreshToken(user.getUsername());

        // Redis에 저장
        refreshTokenService.saveRefreshToken(user.getUsername(), refreshToken);

        return new JwtResponse(accessToken, refreshToken);
    }



/* 기존 비밀번호 재설정 방식
    // 비밀번호 재설정
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                // .orElseThrow(() -> new RuntimeException("해당 사용자를 찾을 수 없습니다."));
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "해당 사용자를 찾을 수 없습니다.")); // 수정

        if (!user.getEmail().equals(request.getEmail())) {
            // throw new RuntimeException("이메일이 일치하지 않습니다.");
            throw new CustomException(HttpStatus.BAD_REQUEST, "이메일이 일치하지 않습니다."); // 수정
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
*/

    //이메일 인증 방식
    public void resetPasswordByEmail(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "해당 이메일의 사용자를 찾을 수 없습니다."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }


    // 마이페이지
    //내 정보 조회 프로필 이미지 추가 버전
    public UserInfoResponse getMyInfo(String username) {
        User user = userRepository.findByUsername(username)
                // .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "사용자 정보를 찾을 수 없습니다.")); // 수정

        return new UserInfoResponse(
                user.getUsername(),
                user.getEmail(),
                user.getNickname(),
                user.getRole(),
                user.getProfileImageUrl()
        );
    }

    /*
    // /me 유저 정보 수정 (nickname, email)
    public void updateMyInfo(String username, UpdateUserRequest request) {
        User user = userRepository.findByUsername(username)
                // .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.")); // 수정

        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());
        userRepository.save(user);
    }
    */

    //유저 정보 수정 프로필 이미지 추가버전
    public void updateMyInfo(String username, UpdateUserRequest request, MultipartFile profileImage) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());

        // 프로필 이미지가 새로 들어왔을 경우
        if (profileImage != null && !profileImage.isEmpty()) {
            // 기존 이미지 삭제
            if (user.getProfileImageUrl() != null) {
                s3Service.delete(user.getProfileImageUrl());
            }

            // 새 이미지 업로드
            String profileImageUrl = s3Service.upload(profileImage, "profiles");
            user.setProfileImageUrl(profileImageUrl);
        }

        userRepository.save(user);
    }


    // 비밀번호 변경
    public void updatePassword(String username, UpdatePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                // .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.")); // 수정

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            // throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
            throw new CustomException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."); // 수정
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /*
    // 회원 탈퇴
    public void deleteUser(String username) {
        User user = userRepository.findByUsername(username)
                // .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.")); // 수정

        userRepository.delete(user);
    }
    */
    //회원 탈퇴, 이미지 삭제 추가 버전
    public void deleteUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new CustomException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        // 프로필 이미지 삭제 (존재할 경우)
        if (user.getProfileImageUrl() != null) {
            s3Service.delete(user.getProfileImageUrl());
        }

        // 사용자 삭제
        userRepository.delete(user);
    }


    //refresh token
    public JwtResponse reissueAccessToken(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "유효하지 않은 Refresh Token입니다.");
        }

        String username = jwtProvider.getUsernameFromToken(refreshToken);
        String storedToken = refreshTokenService.getRefreshToken(username);

        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, "저장된 리프레시 토큰과 일치하지 않습니다.");
        }

        String newAccessToken = jwtProvider.createAccessToken(username);
        return new JwtResponse(newAccessToken, refreshToken); // refreshToken은 그대로 사용
    }


    //로그아웃 메서드, 리프레시 토큰 삭제
    public void logout(String username) {
        refreshTokenService.deleteRefreshToken(username);
    }



}
