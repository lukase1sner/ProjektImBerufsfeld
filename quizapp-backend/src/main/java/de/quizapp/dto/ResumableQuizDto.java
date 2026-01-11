package de.quizapp.dto;

import java.util.UUID;

public class ResumableQuizDto {

    private UUID quizId;
    private UUID attemptId;

    private String quizTitle;

    private int totalQuestions;
    private int answeredQuestions;

    private int score;

    // ✅ neue Felder für UI
    private boolean finished;
    private int correctCount;
    private int wrongCount;
    private int progressPercent;

    public ResumableQuizDto() {}

    public UUID getQuizId() { return quizId; }
    public void setQuizId(UUID quizId) { this.quizId = quizId; }

    public UUID getAttemptId() { return attemptId; }
    public void setAttemptId(UUID attemptId) { this.attemptId = attemptId; }

    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getAnsweredQuestions() { return answeredQuestions; }
    public void setAnsweredQuestions(int answeredQuestions) { this.answeredQuestions = answeredQuestions; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }

    public int getWrongCount() { return wrongCount; }
    public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }

    public int getProgressPercent() { return progressPercent; }
    public void setProgressPercent(int progressPercent) { this.progressPercent = progressPercent; }
}