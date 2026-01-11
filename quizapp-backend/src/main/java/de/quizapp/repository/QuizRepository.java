package de.quizapp.repository;

import de.quizapp.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    // ✅ für QuizService.listByOwner(...)
    List<Quiz> findByOwnerUserId(UUID ownerUserId);

    // ✅ für QuizPlayService.getNewPublishedQuizzesForUser(...)
    List<Quiz> findByIsPublishedTrueOrderByCreatedAtDesc();
}