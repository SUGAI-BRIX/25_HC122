package com.sugai.brix.product.service;

import com.sugai.brix.common.s3.S3Service;
import com.sugai.brix.product.dto.*;
import com.sugai.brix.product.entity.FruitGradePrice;
import com.sugai.brix.product.entity.FruitType;
import com.sugai.brix.product.entity.Product;
import com.sugai.brix.product.repository.FruitGradePriceRepository;
import com.sugai.brix.product.repository.FruitTypeRepository;
import com.sugai.brix.product.repository.ProductRepository;
import com.sugai.brix.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final FruitTypeRepository fruitTypeRepository;
    private final FruitGradePriceRepository fruitGradePriceRepository;
    private final ProductRepository productRepository;
    private final S3Service s3Service;

    // 과일 목록 조회
    public List<FruitTypeDto> getFruitTypes() {
        List<FruitType> fruitTypes = fruitTypeRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        return fruitTypes.stream()
                .map(f -> new FruitTypeDto(f.getId(), f.getName()))
                .collect(Collectors.toList());
    }

/*
    public List<ProductSummaryDto> getProductsByFruitType(String fruitName) {
        List<Product> products = productRepository.findAllByFruitType_Name(fruitName);
        return products.stream()
                .map(ProductSummaryDto::from)
                .toList();
    }


    //과일 판매글 전체 조회 메서드
    public List<ProductSummaryDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(ProductSummaryDto::from)
                .toList();
    }
*/


    //search 조건 조합 처리
    public List<ProductSummaryDto> search(String title, String fruitName, String grade) {
        List<Product> products;

        boolean hasTitle = title != null && !title.isBlank();
        boolean hasFruitName = fruitName != null && !fruitName.isBlank();
        boolean hasGrade = grade != null && !grade.isBlank();

        if (hasTitle && hasFruitName && hasGrade) {
            products = productRepository.findAllByTitleContainingAndFruitType_NameAndGrade(title, fruitName, grade);
        } else if (hasTitle && hasFruitName) {
            products = productRepository.findAllByTitleContainingAndFruitType_Name(title, fruitName);
        } else if (hasTitle && hasGrade) {
            products = productRepository.findAllByTitleContainingAndGrade(title, grade);
        } else if (hasFruitName && hasGrade) {
            products = productRepository.findAllByFruitType_NameAndGrade(fruitName, grade);
        } else if (hasTitle) {
            products = productRepository.findAllByTitleContaining(title);
        } else if (hasFruitName) {
            products = productRepository.findAllByFruitType_Name(fruitName);
        } else if (hasGrade) {
            products = productRepository.findAllByGrade(grade);
        } else {
            products = productRepository.findAll();
        }

        return products.stream()
                .map(ProductSummaryDto::from)
                .toList();
    }


    //상세 글 조회 메서드
    public ProductDetailDto getProductDetail(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("해당 상품이 존재하지 않습니다."));
        return ProductDetailDto.from(product);
    }

    // 과일의 상한가 평균가 하한가 금액 추천가 조회
    public PriceEstimateDto estimatePrice(Long fruitTypeId, String grade, int quantity) {
        FruitType fruitType = fruitTypeRepository.findById(fruitTypeId)
                .orElseThrow(() -> new IllegalArgumentException("과일 ID가 존재하지 않습니다."));

        FruitGradePrice priceInfo = fruitGradePriceRepository
                .findByFruitTypeAndGrade(fruitType, grade)
                .orElseThrow(() -> new IllegalArgumentException("기준 가격이 존재하지 않습니다."));

        return new PriceEstimateDto(
                fruitType.getName(),
                grade,
                quantity,
                priceInfo.getMinPrice() * quantity,
                priceInfo.getAvgPrice() * quantity,
                priceInfo.getMaxPrice() * quantity
        );
    }

    // 상품 등록
    @Transactional
    public void createProduct(ProductCreateRequest request, User seller) {
        FruitType fruitType = fruitTypeRepository.findById(request.getFruitTypeId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 과일 타입입니다."));

        // 상품등록 이미지 업로드
        String imageUrl = null;
        MultipartFile file = request.getProductImage();
        if (file != null && !file.isEmpty()) {
            imageUrl = s3Service.upload(file, "products");  // S3 'products' 폴더에 저장
        }

        Product product = new Product();
        product.setFruitType(fruitType);
        product.setGrade(request.getGrade());
        product.setQuantity(request.getQuantity());
        product.setPrice(request.getPrice());
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        product.setProductImageUrl(imageUrl); // 업로드된 S3 이미지 경로 저장
        product.setSeller(seller);

        productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long productId, User requester) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));

        // 작성자가 아닌 사람이 삭제 시도하는 경우
        if (!product.getSeller().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("해당 상품을 삭제할 권한이 없습니다.");
        }

        // 이미지가 있을 경우 S3에서 삭제
        String imageUrl = product.getProductImageUrl();
        if (imageUrl != null && !imageUrl.isBlank()) {
            s3Service.delete(imageUrl);
        }

        // DB에서 삭제
        productRepository.delete(product);
    }

    // 인기 판매글 조회 - 평균 평점 4점 이상 + 리뷰 많은 순 Top 5
    @Transactional
    public List<ProductSummaryDto> getTop5PopularProducts() {
        Pageable pageable = PageRequest.of(0, 5);  // 상위 5만 반환
        Page<Product> page = productRepository.findTop5ByAverageRating(pageable);

        return page.getContent().stream()
                .map(ProductSummaryDto::from)
                .toList();
    }
}