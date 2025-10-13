

package com.sugai.brix.common.config;

import com.sugai.brix.common.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {
        http
                //6.1 지원중단, lambda DSL방식으로 마이그레이션 .from chatgpt
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable())) // H2 콘솔 허용
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**","/email/**", "/h2-console/**").permitAll()
                        .requestMatchers("/user/**","/products/**", "/inspections/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);


                /*
                .csrf().disable()
                .headers().frameOptions().disable() //  H2 콘솔 사용을 위해 frame 옵션 해제
                .and()
                .authorizeHttpRequests()
                .requestMatchers("/auth/**").permitAll() // 로그인, 회원가입 허용
                .requestMatchers("/h2-console/**").permitAll() //  H2 콘솔 허용
                .requestMatchers("/user/**").authenticated() // 마이페이지 등은 인증 필요
                .anyRequest().authenticated()
                .and()
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
                */


/*
                .csrf().disable()
                .authorizeHttpRequests()
                .requestMatchers("/auth/**").permitAll()   // 로그인, 회원가입
                .requestMatchers("/user/**").authenticated() // 마이페이지 등 사용자 인증 필요
                .anyRequest().authenticated()
                .and()
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
*/
        return http.build();
    }
}