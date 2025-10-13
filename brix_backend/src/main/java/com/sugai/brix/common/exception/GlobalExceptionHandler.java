package com.sugai.brix.common.exception;

import com.sugai.brix.user.dto.CommonResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<CommonResponse<Void>> handleCustomException(CustomException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(CommonResponse.<Void>builder()
                        .status(ex.getHttpStatus().value())
                        .message(ex.getMessage())
                        .data(null)
                        .build());
    }

    // 혹시 RuntimeException 일반 처리하고 싶으면 이것도 추가 가능
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<CommonResponse<Void>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(400)
                .body(CommonResponse.<Void>builder()
                        .status(400)
                        .message(ex.getMessage())
                        .data(null)
                        .build());
    }
}