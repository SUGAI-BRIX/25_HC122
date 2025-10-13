package com.sugai.brix.user.dto;


import com.sugai.brix.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserInfoResponse {
    private String username;
    private String email;
    private String nickname;
    private Role role;
    private String profileImageUrl;
}