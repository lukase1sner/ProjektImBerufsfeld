package de.quizapp.dto;

import java.util.List;
import java.util.UUID;

public class ReviewQuestionDto {
    private UUID questionId;
    private int position;
    private String question;
    private List<String> options;

    private Integer selectedIndex;   // was gewählt wurde (null wenn nicht beantwortet)
    private int correctIndex;
    private boolean correct;
    private String explanation;

    public ReviewQuestionDto() {}

    public ReviewQuestionDto(UUID questionId, int position, String question, List<String> options,
                             Integer selectedIndex, int correctIndex, boolean correct, String explanation) {
        this.questionId = questionId;
        this.position = position;
        this.question = question;
        this.options = options;
        this.selectedIndex = selectedIndex;
        this.correctIndex = correctIndex;
        this.correct = correct;
        this.explanation = explanation;
    }

    public UUID getQuestionId() { return questionId; }
    public int getPosition() { return position; }
    public String getQuestion() { return question; }
    public List<String> getOptions() { return options; }
    public Integer getSelectedIndex() { return selectedIndex; }
    public int getCorrectIndex() { return correctIndex; }
    public boolean isCorrect() { return correct; }
    public String getExplanation() { return explanation; }
}