package de.quizapp.dto;

import java.util.List;
import java.util.UUID;

public class CurrentQuestionDto {
    private UUID questionId;
    private int position;
    private String question;
    private List<String> options;

    // ✅ NEU: Damit beim Zurückspringen die Auswertung sichtbar ist
    private boolean answered;
    private Integer selectedIndex;
    private Integer correctIndex;
    private Boolean correct;
    private String explanation;

    public CurrentQuestionDto() {}

    public CurrentQuestionDto(UUID questionId, int position, String question, List<String> options) {
        this.questionId = questionId;
        this.position = position;
        this.question = question;
        this.options = options;
    }

    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public boolean isAnswered() { return answered; }
    public void setAnswered(boolean answered) { this.answered = answered; }

    public Integer getSelectedIndex() { return selectedIndex; }
    public void setSelectedIndex(Integer selectedIndex) { this.selectedIndex = selectedIndex; }

    public Integer getCorrectIndex() { return correctIndex; }
    public void setCorrectIndex(Integer correctIndex) { this.correctIndex = correctIndex; }

    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}