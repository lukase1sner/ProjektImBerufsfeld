package de.quizapp.controller;

import de.quizapp.dto.QuizCreateRequest;
import de.quizapp.dto.QuizDetailDto;
import de.quizapp.dto.QuizListItemDto;
import de.quizapp.dto.QuizUpdateRequestDto;
import de.quizapp.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    // LIST: fürs Frontend (QuizzesVerwalten.jsx erwartet id,title,isPublished)
    @GetMapping
    public ResponseEntity<List<QuizListItemDto>> listAll() {
        return ResponseEntity.ok(quizService.listAll());
    }

    // DETAIL
    @GetMapping("/{quizId}")
    public ResponseEntity<QuizDetailDto> detail(@PathVariable UUID quizId) {
        return ResponseEntity.ok(quizService.getDetail(quizId));
    }

    // CREATE
    @PostMapping
    public ResponseEntity<UUID> create(@RequestBody QuizCreateRequest req) {
        return ResponseEntity.ok(quizService.createQuiz(req));
    }

    // UPDATE
    @PutMapping("/{quizId}")
    public ResponseEntity<Void> update(@PathVariable UUID quizId, @RequestBody QuizUpdateRequestDto body) {
        quizService.updateQuiz(quizId, body);
        return ResponseEntity.ok().build();
    }

    // DELETE
    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> delete(@PathVariable UUID quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok().build();
    }
}