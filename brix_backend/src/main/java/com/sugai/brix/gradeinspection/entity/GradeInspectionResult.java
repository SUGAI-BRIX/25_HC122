/*
package com.sugai.brix.gradeinspection.entity;

import com.sugai.brix.product.entity.FruitType;
import com.sugai.brix.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@Entity
public class GradeInspectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    private FruitType fruitType;

    private LocalDateTime inspectedAt;

    private int countS;
    private int countA;
    private int countB;
    private int countC;
}
*/
package com.sugai.brix.gradeinspection.entity;

import com.sugai.brix.product.entity.FruitType;
import com.sugai.brix.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "grade_inspection_result",
        uniqueConstraints = @UniqueConstraint(columnNames = {"seller_id", "fruit_type_id"})
)
public class GradeInspectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 판매자 (유저)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    // 과일 종류
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fruit_type_id", nullable = false)
    private FruitType fruitType;

    // 검사 일시
    private LocalDateTime inspectedAt;

    // 등급별 개수
    private int countS;
    private int countA;
    private int countB;
    private int countC;
}
