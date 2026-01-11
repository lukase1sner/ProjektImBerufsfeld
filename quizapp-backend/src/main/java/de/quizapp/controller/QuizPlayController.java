package de.quizapp.controller;

import de.quizapp.dto.*;
import de.quizapp.service.QuizPlayService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/play")
public class QuizPlayController {

    private final QuizPlayService quizPlayService;

    public QuizPlayController(QuizPlayService quizPlayService) {
        this.quizPlayService = quizPlayService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Kein eingeloggter Benutzer gefunden.");
        }
        return UUID.fromString(auth.getName());
    }

    @GetMapping("/quizzes/new")
    public ResponseEntity<List<QuizListItemDto>> newQuizzes() {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getNewPublishedQuizzesForUser(userId));
    }

    @GetMapping("/quizzes/resumable")
    public ResponseEntity<List<ResumableQuizDto>> resumable() {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getResumableQuizzesForUser(userId));
    }

    @PostMapping("/quizzes/{quizId}/restart")
    public ResponseEntity<AttemptStartedDto> restart(@PathVariable UUID quizId) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.restartAttempt(userId, quizId));
    }

    @PostMapping("/attempts")
    public ResponseEntity<AttemptStartedDto> startAttempt(@RequestBody StartAttemptRequest req) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.startOrResumeAttempt(userId, req));
    }

    @GetMapping("/attempts/{attemptId}/meta")
    public ResponseEntity<AttemptMetaDto> getAttemptMeta(@PathVariable UUID attemptId) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getAttemptMeta(userId, attemptId));
    }

    // ✅ Überblick: welche Fragen beantwortet?
    @GetMapping("/attempts/{attemptId}/overview")
    public ResponseEntity<AttemptOverviewDto> overview(@PathVariable UUID attemptId) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getAttemptOverview(userId, attemptId));
    }

    // ✅ Standard: currentPosition
    @GetMapping("/attempts/{attemptId}/question")
    public ResponseEntity<CurrentQuestionDto> getCurrentQuestion(@PathVariable UUID attemptId) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getCurrentQuestion(userId, attemptId));
    }

    // ✅ Springen: Frage an Position
    @GetMapping("/attempts/{attemptId}/question/{position}")
    public ResponseEntity<CurrentQuestionDto> getQuestionByPosition(
            @PathVariable UUID attemptId,
            @PathVariable int position
    ) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getQuestionByPosition(userId, attemptId, position));
    }

    @PostMapping("/attempts/{attemptId}/answer")
    public ResponseEntity<AnswerResultDto> answer(@PathVariable UUID attemptId, @RequestBody AnswerRequest req) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.answer(userId, attemptId, req));
    }

    // ✅ Ergebnis
    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<AttemptResultDto> result(@PathVariable UUID attemptId) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getAttemptResult(userId, attemptId));
    }

    // ✅ Review (Frage einzeln + Ergebnis)
    @GetMapping("/attempts/{attemptId}/review/{position}")
    public ResponseEntity<ReviewQuestionDto> review(@PathVariable UUID attemptId, @PathVariable int position) {
        UUID userId = currentUserId();
        return ResponseEntity.ok(quizPlayService.getReviewQuestion(userId, attemptId, position));
    }
}