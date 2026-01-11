package de.quizapp.dto;

public class AnswerResultDto {

    private boolean correct;
    private int correctIndex;
    private String explanation;
    private int score;
    private boolean finished;
    private Integer nextPosition; // null wenn finished

    public AnswerResultDto() {}

    public AnswerResultDto(boolean correct, int correctIndex, String explanation, int score, boolean finished, Integer nextPosition) {
        this.correct = correct;
        this.correctIndex = correctIndex;
        this.explanation = explanation;
        this.score = score;
        this.finished = finished;
        this.nextPosition = nextPosition;
    }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public int getCorrectIndex() { return correctIndex; }
    public void setCorrectIndex(int correctIndex) { this.correctIndex = correctIndex; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public Integer getNextPosition() { return nextPosition; }
    public void setNextPosition(Integer nextPosition) { this.nextPosition = nextPosition; }
}