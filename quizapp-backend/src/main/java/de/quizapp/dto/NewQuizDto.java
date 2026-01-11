package de.quizapp.dto;

import java.util.UUID;

/**
 * Kurz-Darstellung eines veröffentlichten Quiz, das der Anwender noch NICHT begonnen hat.
 * Wird in "Neue Quizzes entdecken" genutzt.
 */
public class NewQuizDto {

    private UUID id;
    private String title;

    public NewQuizDto() {
    }

    public NewQuizDto(UUID id, String title) {
        this.id = id;
        this.title = title;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}