package de.quizapp.controller;

import de.quizapp.dto.UpdateProfileRequest;
import de.quizapp.dto.UserProfileDto;
import de.quizapp.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Kein eingeloggter Benutzer gefunden.");
        }
        return UUID.fromString(auth.getName());
    }

    @GetMapping
    public ResponseEntity<UserProfileDto> me() {
        UUID userId = currentUserId();
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping
    public ResponseEntity<UserProfileDto> update(@RequestBody UpdateProfileRequest req) throws Exception {
        UUID userId = currentUserId();
        return ResponseEntity.ok(profileService.updateProfile(userId, req));
    }
}