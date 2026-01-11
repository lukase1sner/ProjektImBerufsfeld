package de.quizapp.dto;

import java.util.List;
import java.util.UUID;

public record QuizDetailDto(
        UUID id,
        String title,
        boolean isPublished,
        List<QuestionDto> questions
) {
    public record QuestionDto(
            UUID id,
            int position,
            String question,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            int correctIndex,
            String explanation
    ) {}
}