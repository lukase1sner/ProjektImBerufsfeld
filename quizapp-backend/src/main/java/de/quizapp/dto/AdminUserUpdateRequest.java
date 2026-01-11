package de.quizapp.dto;

public class AdminUserUpdateRequest {
    private String role;
    private String firstName;
    private String lastName;
    private String email;

    public String getRole() { return role; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }

    public void setRole(String role) { this.role = role; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
}