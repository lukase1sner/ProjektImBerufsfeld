package de.quizapp.controller;

import de.quizapp.dto.LeaderboardEntryDto;
import de.quizapp.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Kein eingeloggter Benutzer gefunden.");
        }
        return UUID.fromString(auth.getName());
    }

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryDto>> leaderboard(
            @RequestParam(defaultValue = "50") int limit
    ) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(leaderboardService.getLeaderboard(userId, limit));
    }
}