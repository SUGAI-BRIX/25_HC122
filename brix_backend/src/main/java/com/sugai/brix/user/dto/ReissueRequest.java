package com.sugai.brix.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class ReissueRequest {

    @NotBlank(message = "refreshToken은 필수입니다.")
    private String refreshToken;
}
