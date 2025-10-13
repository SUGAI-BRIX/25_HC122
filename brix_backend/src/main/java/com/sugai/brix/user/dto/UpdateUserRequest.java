package com.sugai.brix.user.dto;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateUserRequest {

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String nickname;
}
