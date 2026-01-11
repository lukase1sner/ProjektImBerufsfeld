package de.quizapp.dto;

import java.util.List;
import java.util.UUID;

public record QuestionViewDto(
        UUID questionId,
        int position,
        String question,
        List<String> options
) {}