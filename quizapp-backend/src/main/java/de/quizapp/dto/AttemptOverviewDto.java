package de.quizapp.dto;

import java.util.List;
import java.util.UUID;

public class AttemptOverviewDto {

    public static class Item {
        private int position;
        private boolean answered;
        private Boolean correct; // null wenn nicht beantwortet

        public Item() {}

        public Item(int position, boolean answered, Boolean correct) {
            this.position = position;
            this.answered = answered;
            this.correct = correct;
        }

        public int getPosition() { return position; }
        public boolean isAnswered() { return answered; }
        public Boolean getCorrect() { return correct; }
    }

    private UUID attemptId;
    private int totalQuestions;
    private int answeredQuestions;
    private List<Item> items;

    public AttemptOverviewDto() {}

    public AttemptOverviewDto(UUID attemptId, int totalQuestions, int answeredQuestions, List<Item> items) {
        this.attemptId = attemptId;
        this.totalQuestions = totalQuestions;
        this.answeredQuestions = answeredQuestions;
        this.items = items;
    }

    public UUID getAttemptId() { return attemptId; }
    public int getTotalQuestions() { return totalQuestions; }
    public int getAnsweredQuestions() { return answeredQuestions; }
    public List<Item> getItems() { return items; }
}