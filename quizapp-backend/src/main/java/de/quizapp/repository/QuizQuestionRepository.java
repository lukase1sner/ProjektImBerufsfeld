package de.quizapp.repository;

import de.quizapp.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {

    List<QuizQuestion> findByQuiz_IdOrderByPositionAsc(UUID quizId);

    long countByQuiz_Id(UUID quizId);

    @Modifying
    @Query("delete from QuizQuestion q where q.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") UUID quizId);
}