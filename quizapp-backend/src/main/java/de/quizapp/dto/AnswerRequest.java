package de.quizapp.dto;

import java.util.UUID;

public class AnswerRequest {
    private UUID questionId;
    private Integer selectedIndex;

    public AnswerRequest() {}

    public AnswerRequest(UUID questionId, Integer selectedIndex) {
        this.questionId = questionId;
        this.selectedIndex = selectedIndex;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public Integer getSelectedIndex() {
        return selectedIndex;
    }

    public void setSelectedIndex(Integer selectedIndex) {
        this.selectedIndex = selectedIndex;
    }
}