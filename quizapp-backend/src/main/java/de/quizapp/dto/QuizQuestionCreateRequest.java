package de.quizapp.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class QuizQuestionCreateRequest {

    @NotBlank
    public String question;

    @NotBlank public String optionA;
    @NotBlank public String optionB;
    @NotBlank public String optionC;
    @NotBlank public String optionD;

    @NotNull
    @Min(0) @Max(3)
    public Integer correctIndex;

    public String explanation;
}