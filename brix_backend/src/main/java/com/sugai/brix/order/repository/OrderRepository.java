package com.sugai.brix.order.repository;

import com.sugai.brix.order.entity.Order;
import com.sugai.brix.order.entity.OrderStatus;
import com.sugai.brix.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // 구매자 기준, 특정 상태를 제외한 주문 조회 (예: CANCELLED 제외)
    List<Order> findByBuyerAndStatusNot(User buyer, OrderStatus status);

}
