package de.quizapp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class QuizCreateRequest {

    @NotNull
    public UUID ownerUserId;

    @NotBlank
    public String title;

    @NotNull
    public Boolean isPublished;

    @Valid
    @NotNull
    public List<QuizQuestionCreateRequest> questions;
}