package com.sugai.brix.graph.service;

import com.sugai.brix.graph.dto.FruitPriceDto;
import com.sugai.brix.graph.repository.FruitPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FruitPriceService { // 과일 시세 그래프용 가격 조회

    private final FruitPriceRepository fruitPriceRepository;

    public List<FruitPriceDto> getPriceData(int itemCode, int quality, LocalDate start, LocalDate end) {
        // DB에서 itemCode + quality + 날짜범위로 데이터 조회 후 DTO로 매핑
        return fruitPriceRepository
                .findByItemCodeAndQualityAndDateBetweenOrderByDateAsc(itemCode, quality, start, end)
                .stream()
                .map(f -> new FruitPriceDto(f.getDate(), f.getPrice()))
                .collect(Collectors.toList());
    }
}
