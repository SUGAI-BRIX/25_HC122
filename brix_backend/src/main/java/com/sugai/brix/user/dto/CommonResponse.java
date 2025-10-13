package com.sugai.brix.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class CommonResponse<T> {
    private int status;
    private String message;
    private T data;
}
