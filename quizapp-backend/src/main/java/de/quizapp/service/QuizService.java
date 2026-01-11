package de.quizapp.service;

import de.quizapp.dto.*;
import de.quizapp.model.Quiz;
import de.quizapp.model.QuizQuestion;
import de.quizapp.repository.QuizQuestionRepository;
import de.quizapp.repository.QuizRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final EntityManager entityManager;

    public QuizService(
            QuizRepository quizRepository,
            QuizQuestionRepository quizQuestionRepository,
            EntityManager entityManager
    ) {
        this.quizRepository = quizRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public UUID createQuiz(QuizCreateRequest req) {
        Quiz quiz = new Quiz();
        quiz.setOwnerUserId(req.ownerUserId);
        quiz.setTitle(req.title);
        quiz.setPublished(Boolean.TRUE.equals(req.isPublished));

        for (int i = 0; i < req.questions.size(); i++) {
            var qReq = req.questions.get(i);

            QuizQuestion qq = new QuizQuestion();
            qq.setPosition(i);
            qq.setQuestion(qReq.question);
            qq.setOptionA(qReq.optionA);
            qq.setOptionB(qReq.optionB);
            qq.setOptionC(qReq.optionC);
            qq.setOptionD(qReq.optionD);
            qq.setCorrectIndex(qReq.correctIndex);
            qq.setExplanation(qReq.explanation);

            quiz.addQuestion(qq);
        }

        Quiz saved = quizRepository.save(quiz);
        return saved.getId();
    }

    public List<QuizListItemDto> listAll() {
        return quizRepository.findAll()
                .stream()
                .map(q -> new QuizListItemDto(
                        q.getId(),
                        q.getTitle(),
                        q.isPublished()
                ))
                .toList();
    }

    public List<QuizListItemDto> listByOwner(UUID ownerUserId) {
        return quizRepository.findByOwnerUserId(ownerUserId)
                .stream()
                .map(q -> new QuizListItemDto(
                        q.getId(),
                        q.getTitle(),
                        q.isPublished()
                ))
                .toList();
    }

    public List<QuizListItemDto> listPublished() {
        return quizRepository.findByIsPublishedTrueOrderByCreatedAtDesc()
                .stream()
                .map(q -> new QuizListItemDto(
                        q.getId(),
                        q.getTitle(),
                        q.isPublished()
                ))
                .toList();
    }

    @Transactional
    public QuizDetailDto getDetail(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz nicht gefunden"));

        var questions = quiz.getQuestions()
                .stream()
                .sorted(Comparator.comparingInt(QuizQuestion::getPosition))
                .map(q -> new QuizDetailDto.QuestionDto(
                        q.getId(),
                        q.getPosition(),
                        q.getQuestion(),
                        q.getOptionA(),
                        q.getOptionB(),
                        q.getOptionC(),
                        q.getOptionD(),
                        q.getCorrectIndex(),
                        q.getExplanation()
                ))
                .toList();

        return new QuizDetailDto(
                quiz.getId(),
                quiz.getTitle(),
                quiz.isPublished(),
                questions
        );
    }

    @Transactional
    public void updateQuiz(UUID quizId, QuizUpdateRequestDto body) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz nicht gefunden"));

        quiz.setTitle(body.title());
        quiz.setPublished(Boolean.TRUE.equals(body.isPublished()));

        // ✅ RICHTIG: Repo-Methode geht über quiz.id (Relation)
        quizQuestionRepository.deleteByQuizId(quizId);

        entityManager.flush();
        quiz.getQuestions().clear();

        if (body.questions() != null) {
            for (int i = 0; i < body.questions().size(); i++) {
                var rq = body.questions().get(i);

                QuizQuestion qq = new QuizQuestion();
                qq.setPosition(i);

                qq.setQuestion(rq.question());
                qq.setOptionA(rq.optionA());
                qq.setOptionB(rq.optionB());
                qq.setOptionC(rq.optionC());
                qq.setOptionD(rq.optionD());
                qq.setCorrectIndex(rq.correctIndex() != null ? rq.correctIndex() : 0);
                qq.setExplanation(rq.explanation());

                quiz.addQuestion(qq);
            }
        }

        quizRepository.save(quiz);
    }

    public void deleteQuiz(UUID quizId) {
        quizRepository.deleteById(quizId);
    }
}