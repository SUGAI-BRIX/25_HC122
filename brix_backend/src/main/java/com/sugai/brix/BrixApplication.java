package com.sugai.brix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BrixApplication {

	public static void main(String[] args) {
		SpringApplication.run(BrixApplication.class, args);
	}

}
