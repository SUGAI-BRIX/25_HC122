package com.sugai.brix.graph.service;

import com.sugai.brix.graph.entity.FruitPrice;
import com.sugai.brix.graph.repository.FruitPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import javax.xml.parsers.DocumentBuilderFactory;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class FruitPriceXmlImportService { // 과일 시세 xml 파일을 읽어서 db에 저장

    private final FruitPriceRepository repository;

    public void importFromXml(String path, int itemCode, int quality) throws Exception {
        var is = new ClassPathResource(path).getInputStream();
        Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(is);
        NodeList items = doc.getElementsByTagName("item");

        for (int i = 0; i < items.getLength(); i++) {
            Element el = (Element) items.item(i);

            Node priceNode = el.getElementsByTagName("price").item(0);
            Node regdayNode = el.getElementsByTagName("regday").item(0);

            if (priceNode == null || regdayNode == null) continue;  // 필수값 존재여부 확인
            if (!"서울".equals(getTagValue(el, "countyname"))) continue; // 서울 가락시장 데이터만 저장 (신뢰성있는 데이터)

            String priceStr = priceNode.getTextContent().replace(",", "");
            String regday = regdayNode.getTextContent();
            String yyyy = el.getElementsByTagName("yyyy").item(0).getTextContent();

            // 날짜 조합
            LocalDate date = LocalDate.parse(yyyy + "-" + regday, DateTimeFormatter.ofPattern("yyyy-MM/dd"));

            FruitPrice entity = new FruitPrice();
            entity.setItemName(getTagValue(el, "itemname"));
            entity.setKindName(getTagValue(el, "kindname"));
            entity.setMarketName(getTagValue(el, "marketname"));
            entity.setCountyName(getTagValue(el, "countyname"));
            entity.setPrice(Integer.parseInt(priceStr));
            entity.setDate(date);
            entity.setItemCode(itemCode);
            entity.setQuality(quality);

            repository.save(entity);
        }
    }

    private String getTagValue(Element el, String tag) {
        Node node = el.getElementsByTagName(tag).item(0);
        return node != null ? node.getTextContent() : null;
    }
}
