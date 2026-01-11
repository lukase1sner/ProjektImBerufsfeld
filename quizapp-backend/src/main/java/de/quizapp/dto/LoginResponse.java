package de.quizapp.dto;

public class LoginResponse {

    private String message;
    private String role;
    private String authUserId;
    private String token;

    public LoginResponse(String message, String role, String authUserId, String token) {
        this.message = message;
        this.role = role;
        this.authUserId = authUserId;
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public String getRole() {
        return role;
    }

    public String getAuthUserId() {
        return authUserId;
    }

    public String getToken() {
        return token;
    }
}