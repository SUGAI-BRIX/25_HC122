package com.sugai.brix.order.controller;

import com.sugai.brix.order.dto.OrderRequestDto;
import com.sugai.brix.order.dto.OrderResponseDto;
import com.sugai.brix.order.entity.Order;
import com.sugai.brix.order.entity.OrderStatus;
import com.sugai.brix.order.service.OrderService;
import com.sugai.brix.user.dto.CommonResponse;
import com.sugai.brix.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    // 주문 생성
    @PostMapping
    public ResponseEntity<CommonResponse<OrderResponseDto>> createOrder(
            @RequestBody OrderRequestDto dto,
            @AuthenticationPrincipal User user) {

        Order order = orderService.createOrder(dto.getProductId(), dto.getQuantity(),dto.getDeliveryAddress(), user);

        return ResponseEntity.ok(
                CommonResponse.<OrderResponseDto>builder()
                        .status(200)
                        .message("주문 생성 성공")
                        .data(orderService.convertToDto(order))
                        .build()
        );
    }

    // 내 주문 목록 조회
    @GetMapping("/my")
    public ResponseEntity<CommonResponse<List<OrderResponseDto>>> getMyOrders(
            @AuthenticationPrincipal User user) {

        List<OrderResponseDto> response = orderService.getMyOrders(user).stream()
                .map(orderService::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                CommonResponse.<List<OrderResponseDto>>builder()
                        .status(200)
                        .message("내 주문 목록 조회 성공")
                        .data(response)
                        .build()
        );
    }

    // 주문 상태 업데이트
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<CommonResponse<OrderResponseDto>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam OrderStatus status,
            @AuthenticationPrincipal User user) {

        Order updated = orderService.updateOrderStatus(orderId, status, user);

        return ResponseEntity.ok(
                CommonResponse.<OrderResponseDto>builder()
                        .status(200)
                        .message("주문 상태 업데이트 성공")
                        .data(orderService.convertToDto(updated))
                        .build()
        );
    }

    // 배송 상태 조회
    @GetMapping("/{orderId}/shipping")
    public ResponseEntity<CommonResponse<OrderResponseDto>> getShippingInfo(
            @PathVariable Long orderId) {

        Order order = orderService.getShippingInfo(orderId);

        return ResponseEntity.ok(
                CommonResponse.<OrderResponseDto>builder()
                        .status(200)
                        .message("배송 상태 조회 성공")
                        .data(orderService.convertToDto(order))
                        .build()
        );
    }

    // 주문 취소
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<CommonResponse<OrderResponseDto>> cancelOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal User user) {

        Order cancelled = orderService.cancelOrder(orderId, user);

        return ResponseEntity.ok(
                CommonResponse.<OrderResponseDto>builder()
                        .status(200)
                        .message("주문 취소 성공")
                        .data(orderService.convertToDto(cancelled))
                        .build()
        );
    }
}

