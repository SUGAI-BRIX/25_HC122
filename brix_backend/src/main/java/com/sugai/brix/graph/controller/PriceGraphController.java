package com.sugai.brix.graph.controller;

import com.sugai.brix.graph.dto.FruitPriceDto;
import com.sugai.brix.graph.service.FruitPriceService;
import com.sugai.brix.user.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/graph/fruit-prices")
@RequiredArgsConstructor
public class PriceGraphController {

    private final FruitPriceService fruitPriceService;

    // /graph/fruit-prices?itemCode=226&quality=1&start=2025-01-01&end=2025-06-30
    @GetMapping
    public ResponseEntity<CommonResponse<List<FruitPriceDto>>> getPrices(
            @RequestParam int itemCode,
            @RequestParam int quality,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        List<FruitPriceDto> result = fruitPriceService.getPriceData(itemCode, quality, start, end);

        return ResponseEntity.ok(
                CommonResponse.<List<FruitPriceDto>>builder()
                        .status(200)
                        .message("과일 시세 조회 성공")
                        .data(result)
                        .build()
        );
    }
}
