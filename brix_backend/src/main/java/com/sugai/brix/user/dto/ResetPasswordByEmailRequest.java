package com.sugai.brix.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordByEmailRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일 형식이어야 합니다.")
    private String email;

    @NotBlank(message = "인증번호는 필수입니다.")
    private String code;

    @NotBlank(message = "새 비밀번호는 필수입니다.")
    private String newPassword;
}
