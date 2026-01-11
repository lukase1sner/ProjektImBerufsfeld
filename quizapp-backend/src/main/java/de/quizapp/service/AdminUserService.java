package de.quizapp.service;

import de.quizapp.dto.AdminResetPasswordRequest;
import de.quizapp.dto.AdminUserUpdateRequest;
import de.quizapp.model.AdminUserView;
import de.quizapp.model.User;
import de.quizapp.repository.AdminUserViewRepository;
import de.quizapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AdminUserService {

    private final AdminUserViewRepository viewRepo;
    private final UserRepository userRepo;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${SUPABASE_URL}")
    private String supabaseUrl;

    @Value("${SUPABASE_SERVICE_ROLE_KEY}")
    private String supabaseServiceRoleKey;

    public AdminUserService(AdminUserViewRepository viewRepo, UserRepository userRepo) {
        this.viewRepo = viewRepo;
        this.userRepo = userRepo;
    }

    public List<AdminUserView> list(String role, String firstName, String lastName) {
        return viewRepo.search(role, firstName, lastName);
    }

    public void updateUser(Long id, AdminUserUpdateRequest req) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User nicht gefunden: " + id));

        if (req.getRole() != null && !req.getRole().isBlank()) u.setRole(req.getRole());
        if (req.getFirstName() != null) u.setFirstName(req.getFirstName());
        if (req.getLastName() != null) u.setLastName(req.getLastName());

        userRepo.save(u);

        // Email liegt in auth.users -> nur wenn authUserId vorhanden und Email gesetzt
        if (u.getAuthUserId() != null && req.getEmail() != null && !req.getEmail().isBlank()) {
            supabaseAdminUpdateAuthUser(u.getAuthUserId(), Map.of("email", req.getEmail()));
        }
    }

    public void deleteUser(Long id) {
        User u = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User nicht gefunden: " + id));

        // Wenn Supabase Auth User existiert: im Auth löschen -> FK on delete cascade löscht public.users automatisch
        if (u.getAuthUserId() != null) {
            supabaseAdminDeleteAuthUser(u.getAuthUserId());
            return;
        }

        // Fallback: nur Row löschen
        userRepo.deleteById(id);
    }

    public void resetPassword(Long id, AdminResetPasswordRequest req) {
        if (req.getNewPassword() == null || req.getNewPassword().isBlank()) {
            throw new RuntimeException("newPassword fehlt.");
        }

        User u = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User nicht gefunden: " + id));

        if (u.getAuthUserId() == null) {
            throw new RuntimeException("Kein auth_user_id vorhanden – Passwort-Reset nicht möglich.");
        }

        supabaseAdminUpdateAuthUser(u.getAuthUserId(), Map.of("password", req.getNewPassword()));
    }

    // -----------------------
    // Supabase Auth Admin API
    // -----------------------

    private HttpHeaders supabaseAdminHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseServiceRoleKey);
        headers.setBearerAuth(supabaseServiceRoleKey);
        return headers;
    }

    private void supabaseAdminUpdateAuthUser(UUID authUserId, Map<String, Object> body) {
        String url = supabaseUrl + "/auth/v1/admin/users/" + authUserId;

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, supabaseAdminHeaders());
        ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);

        if (!res.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Supabase Auth Update fehlgeschlagen: " + res.getBody());
        }
    }

    private void supabaseAdminDeleteAuthUser(UUID authUserId) {
        String url = supabaseUrl + "/auth/v1/admin/users/" + authUserId;

        HttpEntity<Void> entity = new HttpEntity<>(supabaseAdminHeaders());
        ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);

        if (!res.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Supabase Auth Delete fehlgeschlagen: " + res.getBody());
        }
    }
}