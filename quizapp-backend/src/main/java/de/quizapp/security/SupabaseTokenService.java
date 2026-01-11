package de.quizapp.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class SupabaseTokenService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String serviceRoleKey;

    public SupabaseTokenService(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service_role_key}") String serviceRoleKey
    ) {
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.restClient = RestClient.create();
    }

    /**
     * Validiert den Bearer Token via Supabase Auth API und gibt die auth_user_id zurück.
     */
    public String resolveUserIdOrThrow(String bearerToken) {
        // ✅ generics, damit keine "raw type" Warnung entsteht
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) restClient.get()
                .uri(supabaseUrl + "/auth/v1/user")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                .header("apikey", serviceRoleKey)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(Map.class);

        if (body == null || body.get("id") == null) {
            throw new IllegalArgumentException("Token ungültig (Supabase user id fehlt)");
        }

        return body.get("id").toString(); // UUID String
    }
}