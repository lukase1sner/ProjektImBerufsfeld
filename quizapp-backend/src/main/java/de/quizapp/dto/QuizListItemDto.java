package de.quizapp.dto;

import java.util.UUID;

public class QuizListItemDto {

    private UUID id;
    private String title;
    private boolean isPublished;

    public QuizListItemDto(UUID id, String title, boolean isPublished) {
        this.id = id;
        this.title = title;
        this.isPublished = isPublished;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public boolean isPublished() { return isPublished; }
}