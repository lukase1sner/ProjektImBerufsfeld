package de.quizapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.quizapp.model.User;
import de.quizapp.repository.UserRepository;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserService {

    private final UserRepository userRepository;

    // ✅ PATCH/PUT Support: RestTemplate mit Apache HttpClient
    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${SUPABASE_URL}")
    private String supabaseUrl;

    @Value("${SUPABASE_SERVICE_ROLE_KEY}")
    private String supabaseServiceRoleKey;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;

        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
        this.restTemplate = new RestTemplate(factory);
    }

    private HttpHeaders supabaseAdminHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseServiceRoleKey);
        headers.setBearerAuth(supabaseServiceRoleKey);
        return headers;
    }

    // ------------------------------------------------------------
    // Supabase-Auth User erzeugen
    // POST /auth/v1/admin/users
    // ------------------------------------------------------------
    public UUID createSupabaseUser(String email, String password) throws Exception {

        String url = supabaseUrl + "/auth/v1/admin/users";

        Map<String, Object> body = Map.of(
                "email", email,
                "password", password,
                "email_confirm", true
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, supabaseAdminHeaders());

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Supabase create fehlgeschlagen (" + response.getStatusCode() + "): " + response.getBody());
        }

        JsonNode json = objectMapper.readTree(response.getBody());
        return UUID.fromString(json.get("id").asText());
    }

    // ------------------------------------------------------------
    // Supabase-Auth User updaten (E-Mail / Passwort)
    // ✅ FIX: Admin-Endpoint erwartet PUT (nicht PATCH)
    // PUT /auth/v1/admin/users/{uid}
    // ------------------------------------------------------------
    public void updateSupabaseUser(UUID authUserId, String newEmail, String newPassword) throws Exception {
        if (authUserId == null) throw new Exception("auth_user_id fehlt (Supabase).");

        String url = supabaseUrl + "/auth/v1/admin/users/" + authUserId;

        Map<String, Object> body = new HashMap<>();
        if (newEmail != null && !newEmail.isBlank()) {
            body.put("email", newEmail.trim());
            body.put("email_confirm", true);
        }
        if (newPassword != null && !newPassword.isBlank()) {
            body.put("password", newPassword.trim());
        }

        if (body.isEmpty()) return;

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, supabaseAdminHeaders());

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Supabase update fehlgeschlagen (" + response.getStatusCode() + "): " + response.getBody());
        }
    }

    // ------------------------------------------------------------
    // Supabase-Auth User löschen
    // DELETE /auth/v1/admin/users/{uid}
    // ------------------------------------------------------------
    public void deleteSupabaseUser(UUID authUserId) throws Exception {
        if (authUserId == null) throw new Exception("auth_user_id fehlt (Supabase).");

        String url = supabaseUrl + "/auth/v1/admin/users/" + authUserId;

        HttpEntity<Void> entity = new HttpEntity<>(supabaseAdminHeaders());

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Supabase delete fehlgeschlagen (" + response.getStatusCode() + "): " + response.getBody());
        }
    }

    // ------------------------------------------------------------
    // Internen Benutzer speichern
    // ------------------------------------------------------------
    public User createUser(User user) throws Exception {

        if (user.getFirstName() == null || user.getFirstName().isBlank()) {
            throw new Exception("Vorname darf nicht leer sein.");
        }

        if (user.getLastName() == null || user.getLastName().isBlank()) {
            throw new Exception("Nachname darf nicht leer sein.");
        }

        if (user.getRole() == null) {
            throw new Exception("Rolle fehlt.");
        }

        // Rolle normalisieren auf DB-Format
        String normalizedRole = switch (user.getRole().toLowerCase()) {
            case "administrator" -> "Administrator";
            case "quiz-entwickler" -> "Quiz-Entwickler";
            case "anwender" -> "Anwender";
            default -> throw new Exception("Ungültige Rolle: " + user.getRole());
        };
        user.setRole(normalizedRole);

        if (user.getAuthUserId() == null) {
            throw new Exception("auth_user_id fehlt.");
        }

        Optional<User> existing = Optional.ofNullable(userRepository.findByAuthUserId(user.getAuthUserId()));
        if (existing.isPresent()) {
            throw new Exception("Benutzer existiert bereits intern.");
        }

        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByAuthUserId(String authUserId) {
        try {
            UUID uuid = UUID.fromString(authUserId);
            return Optional.ofNullable(userRepository.findByAuthUserId(uuid));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<String> getAvailableRoles() {
        return List.of("Administrator", "Quiz-Entwickler", "Anwender");
    }
}