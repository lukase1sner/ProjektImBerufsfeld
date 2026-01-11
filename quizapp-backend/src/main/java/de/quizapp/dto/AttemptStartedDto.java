package de.quizapp.dto;

import java.util.UUID;

public class AttemptStartedDto {
    private UUID attemptId;
    private String quizTitle;
    private int totalQuestions;
    private int score;

    public AttemptStartedDto() {}

    public AttemptStartedDto(UUID attemptId, String quizTitle, int totalQuestions, int score) {
        this.attemptId = attemptId;
        this.quizTitle = quizTitle;
        this.totalQuestions = totalQuestions;
        this.score = score;
    }

    public UUID getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(UUID attemptId) {
        this.attemptId = attemptId;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public void setQuizTitle(String quizTitle) {
        this.quizTitle = quizTitle;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}