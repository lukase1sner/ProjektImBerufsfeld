package de.quizapp.repository;

import de.quizapp.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    // ✅ Start/Resume: neuester Attempt (egal ob finished oder nicht)
    Optional<QuizAttempt> findTopByUserIdAndQuizIdOrderByUpdatedAtDesc(UUID userId, UUID quizId);

    // ✅ Resumable Liste: alle Attempts, neueste zuerst (wir wählen dann pro Quiz den neuesten)
    List<QuizAttempt> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    // ✅ "Neue Quizzes entdecken": Quiz gilt als begonnen sobald irgendein Attempt existiert
    boolean existsByUserIdAndQuizId(UUID userId, UUID quizId);

    // ✅ Profil-Stat: beendete Quizzes
    long countByUserIdAndFinishedTrue(UUID userId);
}