package de.quizapp.controller;

import de.quizapp.dto.LoginResponse;
import de.quizapp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ====================================================
    //                        LOGIN
    // ====================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String password = body.get("password");

        // ===================================================
        //                 E-MAIL VALIDIERUNG
        // ===================================================
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "E-Mail darf nicht leer sein.")
            );
        }

        if (!email.contains("@")) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "E-Mail muss ein @ enthalten.")
            );
        }

        String[] emailParts = email.split("@");
        if (emailParts.length != 2) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Ungültiges E-Mail-Format.")
            );
        }

        if (emailParts[0].isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Vor dem @ muss ein Name stehen.")
            );
        }

        if (emailParts[1].isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Nach dem @ fehlt der Domain-Name.")
            );
        }

        if (!emailParts[1].contains(".")) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Domain muss eine Endung wie .de oder .com haben.")
            );
        }

        String[] domainSections = emailParts[1].split("\\.");
        String tld = domainSections[domainSections.length - 1];

        if (tld.length() < 2) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Ungültige Domain-Endung.")
            );
        }

        // ===================================================
        //                PASSWORT-VALIDIERUNG
        // ===================================================
        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Passwort darf nicht leer sein.")
            );
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Passwort muss mindestens 8 Zeichen lang sein.")
            );
        }

        if (!password.matches(".*[A-Z].*")) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Passwort muss mindestens einen Großbuchstaben enthalten.")
            );
        }

        if (!password.matches(".*[0-9].*")) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Passwort muss mindestens eine Zahl enthalten.")
            );
        }

        if (!password.matches(".*[!@#$%&*].*")) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%&*).")
            );
        }

        // ===================================================
        //                 LOGIN AUSFÜHREN
        // ===================================================
        try {
            LoginResponse response = authService.login(email, password);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                    Map.of("error", e.getMessage())
            );
        }
    }
}