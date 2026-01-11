package de.quizapp.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "quiz_attempt_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "question_id"})
)
public class QuizAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    @Column(name = "selected_index", nullable = false)
    private int selectedIndex;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "answered_at", nullable = false)
    private OffsetDateTime answeredAt;

    @PrePersist
    void prePersist() {
        this.answeredAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }

    public QuizAttempt getAttempt() { return attempt; }
    public void setAttempt(QuizAttempt attempt) { this.attempt = attempt; }

    public QuizQuestion getQuestion() { return question; }
    public void setQuestion(QuizQuestion question) { this.question = question; }

    public int getSelectedIndex() { return selectedIndex; }
    public void setSelectedIndex(int selectedIndex) { this.selectedIndex = selectedIndex; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
}