package de.quizapp.dto;

import java.util.UUID;

public class QuizCreateResponse {
    public UUID id;

    public QuizCreateResponse(UUID id) {
        this.id = id;
    }
}