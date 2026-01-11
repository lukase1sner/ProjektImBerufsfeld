package de.quizapp.dto;

import java.util.List;

public record QuizUpdateRequestDto(
        String title,
        Boolean isPublished,
        List<QuestionUpdateDto> questions
) {
    public record QuestionUpdateDto(
            Integer position,
            String question,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            Integer correctIndex,
            String explanation
    ) {}
}