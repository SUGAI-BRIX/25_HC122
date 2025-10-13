package com.sugai.brix.order.service;

import com.sugai.brix.order.dto.OrderRequestDto;
import com.sugai.brix.order.dto.OrderResponseDto;
import com.sugai.brix.order.entity.Order;
import com.sugai.brix.order.entity.OrderStatus;
import com.sugai.brix.order.repository.OrderRepository;
import com.sugai.brix.product.entity.Product;
import com.sugai.brix.product.repository.ProductRepository;
import com.sugai.brix.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    // 주문 생성
    @Transactional
    public Order createOrder(Long productId, int quantity,String deliveryAddress, User buyer) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Order order = new Order();
        order.setProduct(product);
        order.setBuyer(buyer);
        order.setQuantity(quantity);
        order.setStatus(OrderStatus.PENDING); // 최초 상태는 PENDING
        order.setOrderDate(LocalDateTime.now());
        order.setDeliveryAddress(deliveryAddress);
        // 추후 변경 필요
        order.setExpectedDeliveryDate(LocalDate.now().plusDays(3)); // 일단 기본적으로 주문일로부터 3일 걸린다고 설정

        return orderRepository.save(order);
    }

    // 내 주문 목록 조회 (취소된 주문 제외)
    public List<Order> getMyOrders(User buyer) {
        return orderRepository.findByBuyerAndStatusNot(buyer, OrderStatus.CANCELLED);
    }

    // 주문 상태 업데이트
    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus,User requester) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        // 상품 판매자 ID
        Long sellerId = order.getProduct().getSeller().getId();

        // 관리자 또는 판매자인지 확인
        if (!requester.getRole().equals("ADMIN") && !requester.getId().equals(sellerId)) {
            throw new IllegalStateException("주문 상태 변경 권한이 없습니다.");
        }

        order.setStatus(newStatus);
        return order;
    }

    // 배송 상태 조회
    public Order getShippingInfo(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));
    }

    // 주문 취소
    // 주문 취소
    @Transactional
    public Order cancelOrder(Long orderId, User buyer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        // 본인 주문만 취소 가능
        if (!order.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalStateException("자신의 주문만 취소할 수 있습니다.");
        }

        // 이미 취소되었거나 배송 시작된 주문은 취소 불가
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("해당 주문은 취소할 수 없습니다.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        return order;
    }


    public OrderResponseDto convertToDto(Order order) {
        return OrderResponseDto.builder()
                .orderId(order.getId())
                .productId(order.getProduct().getId())
                .productTitle(order.getProduct().getTitle())
                .price(order.getProduct().getPrice())
                .quantity(order.getQuantity())
                .totalPrice(order.getProduct().getPrice() * order.getQuantity())
                .status(order.getStatus())
                .orderDate(order.getOrderDate())
                .deliveryAddress(order.getDeliveryAddress())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .build();
    }

}
