package de.quizapp.dto;

import java.util.UUID;

public class AttemptMetaDto {

    private UUID attemptId;
    private UUID quizId;
    private String quizTitle;
    private int totalQuestions;
    private int answeredQuestions;
    private int score;

    public AttemptMetaDto() {}

    public AttemptMetaDto(UUID attemptId, UUID quizId, String quizTitle, int totalQuestions, int answeredQuestions, int score) {
        this.attemptId = attemptId;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.totalQuestions = totalQuestions;
        this.answeredQuestions = answeredQuestions;
        this.score = score;
    }

    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }

    public UUID getQuizId() { return quizId; }
    public void setQuizId(UUID quizId) { this.quizId = quizId; }

    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getAnsweredQuestions() { return answeredQuestions; }
    public void setAnsweredQuestions(int answeredQuestions) { this.answeredQuestions = answeredQuestions; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}