package de.quizapp.repository;

import de.quizapp.model.QuizAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, UUID> {

    // ✅ Liste aller Antworten zu einem Attempt
    List<QuizAttemptAnswer> findByAttempt_Id(UUID attemptId);

    // ✅ genau eine Antwort zu Attempt+Question (deine DB hat unique constraint)
    Optional<QuizAttemptAnswer> findByAttempt_IdAndQuestion_Id(UUID attemptId, UUID questionId);

    // ✅ counts
    long countByAttempt_Id(UUID attemptId);

    long countByAttempt_IdAndCorrectTrue(UUID attemptId);

    /* ===============================
       LEADERBOARD
       Punkte = count(correct=true) über ALLE Attempts (nicht nur finished!)
       + nur Rolle "Anwender"
       + Anwender ohne Antworten => 0 Punkte (LEFT JOIN)
       =============================== */

    interface LeaderboardRow {
        UUID getUserId();
        String getFirstName();
        String getLastName();
        long getPoints();
    }

    @Query("""
        select u.authUserId as userId,
               u.firstName as firstName,
               u.lastName as lastName,
               coalesce(sum(case when a.correct = true then 1 else 0 end), 0) as points
        from User u
        left join QuizAttemptAnswer a
               on a.attempt.userId = u.authUserId
        where u.role = 'Anwender'
        group by u.authUserId, u.firstName, u.lastName
        order by coalesce(sum(case when a.correct = true then 1 else 0 end), 0) desc
    """)
    List<LeaderboardRow> getLeaderboardRows();

    @Query("""
        select coalesce(sum(case when a.correct = true then 1 else 0 end), 0)
        from QuizAttemptAnswer a
        where a.attempt.userId = :userId
    """)
    long getTotalPointsForUser(@Param("userId") UUID userId);
}