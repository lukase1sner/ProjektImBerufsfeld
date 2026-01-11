package de.quizapp.dto;

import java.util.UUID;

public class StartAttemptRequest {
    private UUID quizId;

    public StartAttemptRequest() {}

    public StartAttemptRequest(UUID quizId) {
        this.quizId = quizId;
    }

    public UUID getQuizId() {
        return quizId;
    }

    public void setQuizId(UUID quizId) {
        this.quizId = quizId;
    }
}