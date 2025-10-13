/*
package com.sugai.brix.s3;


import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    */
/**
     * 파일을 S3에 업로드하고 파일 URL을 반환
     *//*

    public String upload(MultipartFile file) {
        String fileName = generateFileName(file.getOriginalFilename());

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());

            amazonS3.putObject(new PutObjectRequest(bucket, fileName, file.getInputStream(), metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead)); // 공개 읽기 권한 부여

            return amazonS3.getUrl(bucket, fileName).toString();
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        }
    }

    */
/**
     * S3에서 파일 삭제
     *//*

    public void delete(String fileUrl) {
        String fileName = extractFileName(fileUrl);
        amazonS3.deleteObject(bucket, fileName);
    }

    */
/**
     * 파일명을 UUID로 생성
     *//*

    private String generateFileName(String originalFilename) {
        return UUID.randomUUID() + "_" + originalFilename;
    }

    */
/**
     * URL에서 파일명 추출
     *//*

    private String extractFileName(String fileUrl) {
        return fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    }
}
*/
package com.sugai.brix.common.s3;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    /**
     *  파일을 S3의 지정된 폴더에 업로드하고 URL 반환
     *
     * @param file 업로드할 파일
     * @param folderName 저장할 S3 폴더 이름 (예: "profiles", "products")
     * @return 업로드된 파일의 S3 URL
     */
    public String upload(MultipartFile file, String folderName) {
        String fileName = generateFileName(folderName, file.getOriginalFilename()); // ✅ 폴더명 포함한 파일 경로 생성

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());

            amazonS3.putObject(new PutObjectRequest(bucket, fileName, file.getInputStream(), metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead)); // 공개 읽기 권한 부여

            return amazonS3.getUrl(bucket, fileName).toString();
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * S3에서 파일 삭제
     */
    public void delete(String fileUrl) {
        String fileName = extractFileName(fileUrl);
        amazonS3.deleteObject(bucket, fileName);
    }

    /**
     *  폴더명을 포함한 UUID 기반의 파일명 생성
     *
     * @param folderName S3 상의 폴더 이름
     * @param originalFilename 원본 파일명
     * @return 폴더명/UUID_원본파일명 형식의 S3 Key
     */
    private String generateFileName(String folderName, String originalFilename) {
        return folderName + "/" + UUID.randomUUID() + "_" + originalFilename;
    }

    /**
     * ✅ 파일 URL에서 S3 Key 추출
     * (예: https://bucket.s3.amazonaws.com/profiles/abc.jpg → profiles/abc.jpg)
     */
    private String extractFileName(String fileUrl) {
        try {
            URI uri = new URI(fileUrl);
            return uri.getPath().substring(1); // 앞 슬래시 제거
        } catch (URISyntaxException e) {
            throw new RuntimeException("URL 파싱 실패", e);
        }
    }
}

