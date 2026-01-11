package de.quizapp.dto;

import java.util.UUID;

public class AttemptResultDto {

    private UUID attemptId;
    private UUID quizId;
    private String quizTitle;
    private int totalQuestions;
    private int correctAnswers;
    private int wrongAnswers;
    private int score;

    public AttemptResultDto() {}

    public AttemptResultDto(UUID attemptId, UUID quizId, String quizTitle,
                            int totalQuestions, int correctAnswers, int wrongAnswers, int score) {
        this.attemptId = attemptId;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.wrongAnswers = wrongAnswers;
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

    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }

    public int getWrongAnswers() { return wrongAnswers; }
    public void setWrongAnswers(int wrongAnswers) { this.wrongAnswers = wrongAnswers; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}