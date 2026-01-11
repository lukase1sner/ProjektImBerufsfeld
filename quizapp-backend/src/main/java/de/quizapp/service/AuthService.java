package de.quizapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.quizapp.dto.LoginResponse;
import de.quizapp.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserService userService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${SUPABASE_URL}")
    private String supabaseUrl;

    @Value("${SUPABASE_SERVICE_ROLE_KEY}")
    private String supabaseServiceRoleKey;

    public AuthService(UserService userService) {
        this.userService = userService;
    }

    public LoginResponse login(String email, String password) throws Exception {

        // -------------------------------------------
        // 1. REQUEST AN SUPABASE SENDEN
        // -------------------------------------------
        Map<String, String> requestBody = Map.of(
                "email", email,
                "password", password
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseServiceRoleKey);
        headers.setBearerAuth(supabaseServiceRoleKey);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

        String url = supabaseUrl + "/auth/v1/token?grant_type=password";

        ResponseEntity<String> response;

        try {
            response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );
        } catch (HttpClientErrorException e) {
            throw new Exception("E-Mail oder Passwort ist falsch.");
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("E-Mail oder Passwort ist falsch.");
        }

        JsonNode json = objectMapper.readTree(response.getBody());

        if (!json.has("user")) {
            throw new Exception("Login fehlgeschlagen – keine Benutzerdaten erhalten.");
        }

        // -------------------------------------------
        // 2. DATEN AUS SUPABASE AUSLESEN
        // -------------------------------------------
        String authUserId = json.get("user").get("id").asText();
        String accessToken = json.get("access_token").asText();

        // -------------------------------------------
        // 3. INTERNEN BENUTZER LADEN
        // -------------------------------------------
        Optional<User> dbUserOptional = userService.getUserByAuthUserId(authUserId);

        if (dbUserOptional.isEmpty()) {
            throw new Exception("Benutzer existiert nicht im internen System.");
        }

        User dbUser = dbUserOptional.get();

        // -------------------------------------------
        // 4. ROLLE FORMATIEREN
        // -------------------------------------------
        String formattedRole = switch (dbUser.getRole().toLowerCase()) {
            case "administrator" -> "Administrator";
            case "quiz-entwickler" -> "Quiz-Entwickler";
            case "anwender" -> "Anwender";
            default -> dbUser.getRole();
        };

        // -------------------------------------------
        // 5. ERGEBNIS ZURÜCKGEBEN
        // -------------------------------------------
        return new LoginResponse(
                "Login erfolgreich",
                formattedRole,
                authUserId,
                accessToken
        );
    }
}