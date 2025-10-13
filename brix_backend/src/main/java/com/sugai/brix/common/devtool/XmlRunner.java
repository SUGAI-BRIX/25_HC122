package com.sugai.brix.common.devtool;

import com.sugai.brix.graph.service.FruitPriceXmlImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;

//@Component // Xml 파일로 db에 저장하고 싶을 때 주석 풀기
@RequiredArgsConstructor
public class XmlRunner implements CommandLineRunner { // XML 파일 읽어서 db에 저장할 때 사용

    private final FruitPriceXmlImportService importer;

    @Override
    public void run(String... args) throws Exception {
        importer.importFromXml("kamis/strawberry/strawberry_rank_04.xml", 226, 4);
        // 딸기 (itemcode = 226), 등급 (quality = 1 : bad, 4 : good)
    }
}
