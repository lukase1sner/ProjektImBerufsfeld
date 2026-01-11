package de.quizapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "admin_users_view", schema = "public")
public class AdminUserView {

    @Id
    private Long id;

    private String role;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "auth_user_id")
    private UUID authUserId;

    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    public Long getId() { return id; }
    public String getRole() { return role; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public UUID getAuthUserId() { return authUserId; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }

    public void setId(Long id) { this.id = id; }
    public void setRole(String role) { this.role = role; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setAuthUserId(UUID authUserId) { this.authUserId = authUserId; }
    public void setEmail(String email) { this.email = email; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}