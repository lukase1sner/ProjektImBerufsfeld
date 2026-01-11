package de.quizapp.service;

import de.quizapp.dto.*;
import de.quizapp.model.*;
import de.quizapp.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizPlayService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository quizAttemptAnswerRepository;

    public QuizPlayService(
            QuizRepository quizRepository,
            QuizQuestionRepository quizQuestionRepository,
            QuizAttemptRepository quizAttemptRepository,
            QuizAttemptAnswerRepository quizAttemptAnswerRepository
    ) {
        this.quizRepository = quizRepository;
        this.quizQuestionRepository = quizQuestionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.quizAttemptAnswerRepository = quizAttemptAnswerRepository;
    }

    /* ===============================
       QUIZZES (NEW / RESUMABLE / RESTART)
       =============================== */

    public List<QuizListItemDto> getNewPublishedQuizzesForUser(UUID userId) {
        // ✅ nur veröffentlicht + noch nicht begonnen (egal ob finished oder nicht)
        return quizRepository.findByIsPublishedTrueOrderByCreatedAtDesc()
                .stream()
                .filter(q -> !quizAttemptRepository.existsByUserIdAndQuizId(userId, q.getId()))
                .map(q -> new QuizListItemDto(q.getId(), q.getTitle(), q.isPublished()))
                .collect(Collectors.toList());
    }

    public List<ResumableQuizDto> getResumableQuizzesForUser(UUID userId) {
        // ✅ WICHTIG: NICHT nur finished=false, sondern alle Attempts
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        // Pro Quiz nur den neuesten Attempt (egal ob finished oder nicht)
        Map<UUID, QuizAttempt> latestByQuiz = new LinkedHashMap<>();
        for (QuizAttempt a : attempts) {
            if (a.getQuizId() == null) continue;
            latestByQuiz.putIfAbsent(a.getQuizId(), a);
        }

        List<ResumableQuizDto> result = new ArrayList<>();

        for (QuizAttempt a : latestByQuiz.values()) {
            UUID quizId = a.getQuizId();
            Quiz quiz = quizRepository.findById(quizId).orElse(null);

            int total = safeTotalQuestions(a, quizId);
            int answered = (int) quizAttemptAnswerRepository.countByAttempt_Id(a.getId());
            if (answered > total) answered = total;

            int correctCount = (int) quizAttemptAnswerRepository.countByAttempt_IdAndCorrectTrue(a.getId());
            int wrongCount = Math.max(0, answered - correctCount);

            boolean finished = (total > 0 && answered >= total);

            // ✅ DB-Flag reparieren, falls es „hinterherhinkt“
            if (a.isFinished() != finished) {
                a.setFinished(finished);
                a.setUpdatedAt(Instant.now());
                quizAttemptRepository.save(a);
            }

            int percent = total > 0 ? (int) Math.round((answered * 100.0) / total) : 0;

            ResumableQuizDto dto = new ResumableQuizDto();
            dto.setQuizId(quizId);
            dto.setAttemptId(a.getId());
            dto.setQuizTitle(quiz != null ? quiz.getTitle() : "Quiz");

            dto.setTotalQuestions(total);
            dto.setAnsweredQuestions(answered);

            // ✅ Score aus echten Daten ableiten (robuster als altes attempt.score)
            dto.setScore(correctCount);

            dto.setFinished(finished);
            dto.setCorrectCount(correctCount);
            dto.setWrongCount(wrongCount);
            dto.setProgressPercent(percent);

            result.add(dto);
        }

        return result;
    }

    public AttemptStartedDto restartAttempt(UUID userId, UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz nicht gefunden"));

        QuizAttempt a = quizAttemptRepository
                .findTopByUserIdAndQuizIdOrderByUpdatedAtDesc(userId, quizId)
                .orElse(null);

        // Wenn kein Attempt existiert -> normal starten
        if (a == null) {
            StartAttemptRequest req = new StartAttemptRequest();
            req.setQuizId(quizId);
            return startOrResumeAttempt(userId, req);
        }

        // ✅ Antworten löschen -> wirklich Neustart
        List<QuizAttemptAnswer> answers = quizAttemptAnswerRepository.findByAttempt_Id(a.getId());
        quizAttemptAnswerRepository.deleteAll(answers);

        a.setCurrentPosition(0);
        a.setScore(0);
        a.setFinished(false);
        a.setUpdatedAt(Instant.now());
        quizAttemptRepository.save(a);

        int total = safeTotalQuestions(a, quizId);
        return new AttemptStartedDto(a.getId(), quiz.getTitle(), total, 0);
    }

    /* ===============================
       ATTEMPT START / RESUME
       =============================== */

    public AttemptStartedDto startOrResumeAttempt(UUID userId, StartAttemptRequest req) {
        if (req == null || req.getQuizId() == null) throw new RuntimeException("quizId fehlt");

        UUID quizId = req.getQuizId();
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz nicht gefunden"));
        if (!quiz.isPublished()) throw new RuntimeException("Quiz ist nicht veröffentlicht");

        Optional<QuizAttempt> existing = quizAttemptRepository.findTopByUserIdAndQuizIdOrderByUpdatedAtDesc(userId, quizId);

        // ✅ Resume nur wenn nicht finished – sonst bleibt es ein „beendetes Ergebnis“
        if (existing.isPresent() && !existing.get().isFinished()) {
            QuizAttempt a = existing.get();
            a.setUpdatedAt(Instant.now());
            quizAttemptRepository.save(a);

            int total = safeTotalQuestions(a, quizId);
            int correctCount = (int) quizAttemptAnswerRepository.countByAttempt_IdAndCorrectTrue(a.getId());
            return new AttemptStartedDto(a.getId(), quiz.getTitle(), total, correctCount);
        }

        int total = (int) quizQuestionRepository.countByQuiz_Id(quizId);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUserId(userId);
        attempt.setQuizId(quizId);
        attempt.setCurrentPosition(0);
        attempt.setTotalQuestions(total);
        attempt.setScore(0);
        attempt.setFinished(false);
        attempt.setCreatedAt(Instant.now());
        attempt.setUpdatedAt(Instant.now());

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return new AttemptStartedDto(saved.getId(), quiz.getTitle(), total, 0);
    }

    /* ===============================
       META
       =============================== */

    public AttemptMetaDto getAttemptMeta(UUID userId, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");

        UUID quizId = attempt.getQuizId();
        if (quizId == null) throw new RuntimeException("Attempt hat kein quizId");

        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz nicht gefunden"));

        int total = safeTotalQuestions(attempt, quizId);

        int answered = (int) quizAttemptAnswerRepository.countByAttempt_Id(attemptId);
        if (answered > total) answered = total;

        int correctCount = (int) quizAttemptAnswerRepository.countByAttempt_IdAndCorrectTrue(attemptId);

        return new AttemptMetaDto(attemptId, quizId, quiz.getTitle(), total, answered, correctCount);
    }

    /* ===============================
       OVERVIEW
       =============================== */

    public AttemptOverviewDto getAttemptOverview(UUID userId, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");

        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_IdOrderByPositionAsc(attempt.getQuizId());
        if (questions.isEmpty()) throw new RuntimeException("Quiz hat keine Fragen");

        Map<UUID, QuizAttemptAnswer> byQuestion = quizAttemptAnswerRepository.findByAttempt_Id(attemptId)
                .stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (a, b) -> a));

        List<AttemptOverviewDto.Item> items = new ArrayList<>();
        for (QuizQuestion q : questions) {
            QuizAttemptAnswer a = byQuestion.get(q.getId());
            boolean answered = (a != null);
            Boolean correct = answered ? a.isCorrect() : null;
            items.add(new AttemptOverviewDto.Item(q.getPosition(), answered, correct));
        }

        return new AttemptOverviewDto(attemptId, questions.size(), byQuestion.size(), items);
    }

    /* ===============================
       CURRENT QUESTION (+ Bewertung wenn schon beantwortet)
       =============================== */

    public CurrentQuestionDto getCurrentQuestion(UUID userId, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");

        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_IdOrderByPositionAsc(attempt.getQuizId());
        if (questions.isEmpty()) throw new RuntimeException("Quiz hat keine Fragen");

        int position = attempt.getCurrentPosition();
        QuizQuestion question = questions.stream()
                .filter(q -> q.getPosition() == position)
                .findFirst()
                .orElse(questions.get(0));

        return buildQuestionDto(attempt, question);
    }

    public CurrentQuestionDto getQuestionByPosition(UUID userId, UUID attemptId, int position) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");

        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_IdOrderByPositionAsc(attempt.getQuizId());
        if (questions.isEmpty()) throw new RuntimeException("Quiz hat keine Fragen");

        QuizQuestion question = questions.stream()
                .filter(q -> q.getPosition() == position)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Frage nicht gefunden"));

        attempt.setCurrentPosition(position);
        attempt.setUpdatedAt(Instant.now());
        quizAttemptRepository.save(attempt);

        return buildQuestionDto(attempt, question);
    }

    private CurrentQuestionDto buildQuestionDto(QuizAttempt attempt, QuizQuestion question) {
        CurrentQuestionDto dto = new CurrentQuestionDto(
                question.getId(),
                question.getPosition(),
                question.getQuestion(),
                Arrays.asList(question.getOptionA(), question.getOptionB(), question.getOptionC(), question.getOptionD())
        );

        Optional<QuizAttemptAnswer> answerOpt =
                quizAttemptAnswerRepository.findByAttempt_IdAndQuestion_Id(attempt.getId(), question.getId());

        if (answerOpt.isPresent()) {
            QuizAttemptAnswer a = answerOpt.get();
            dto.setAnswered(true);
            dto.setSelectedIndex(a.getSelectedIndex());
            dto.setCorrectIndex(question.getCorrectIndex());
            dto.setCorrect(a.isCorrect());
            dto.setExplanation(question.getExplanation());
        } else {
            dto.setAnswered(false);
        }

        return dto;
    }

    /* ===============================
       ANSWER (niemals überschreiben)
       =============================== */

    public AnswerResultDto answer(UUID userId, UUID attemptId, AnswerRequest req) {
        if (req == null || req.getQuestionId() == null) throw new RuntimeException("questionId fehlt");

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");
        if (attempt.isFinished()) throw new RuntimeException("Attempt ist bereits beendet");

        QuizQuestion question = quizQuestionRepository.findById(req.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Frage nicht gefunden"));

        Optional<QuizAttemptAnswer> existing =
                quizAttemptAnswerRepository.findByAttempt_IdAndQuestion_Id(attemptId, question.getId());

        // ✅ WICHTIGER FIX: wenn schon beantwortet -> finished ggf. speichern
        if (existing.isPresent()) {
            QuizAttemptAnswer a = existing.get();

            boolean finished = isFinished(attemptId, attempt.getQuizId(), attempt);
            attempt.setUpdatedAt(Instant.now());
            quizAttemptRepository.save(attempt);

            Integer nextPos = finished ? null : findNextUnansweredPosition(attemptId, attempt.getQuizId());
            int correctCount = (int) quizAttemptAnswerRepository.countByAttempt_IdAndCorrectTrue(attemptId);

            return new AnswerResultDto(
                    a.isCorrect(),
                    question.getCorrectIndex(),
                    question.getExplanation(),
                    correctCount,
                    finished,
                    nextPos
            );
        }

        int selected = req.getSelectedIndex();
        boolean correct = (selected == question.getCorrectIndex());

        QuizAttemptAnswer answer = new QuizAttemptAnswer();
        answer.setAttempt(attempt);
        answer.setQuestion(question);
        answer.setSelectedIndex(selected);
        answer.setCorrect(correct);

        quizAttemptAnswerRepository.save(answer);

        boolean finished = isFinished(attemptId, attempt.getQuizId(), attempt);
        Integer nextPos = finished ? null : findNextUnansweredPosition(attemptId, attempt.getQuizId());
        if (nextPos != null) attempt.setCurrentPosition(nextPos);

        attempt.setUpdatedAt(Instant.now());
        quizAttemptRepository.save(attempt);

        int correctCount = (int) quizAttemptAnswerRepository.countByAttempt_IdAndCorrectTrue(attemptId);

        return new AnswerResultDto(
                correct,
                question.getCorrectIndex(),
                question.getExplanation(),
                correctCount,
                finished,
                nextPos
        );
    }

    /* ===============================
       RESULT
       =============================== */

    public AttemptResultDto getAttemptResult(UUID userId, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");

        UUID quizId = attempt.getQuizId();
        Quiz quiz = quizId != null ? quizRepository.findById(quizId).orElse(null) : null;

        int total = safeTotalQuestions(attempt, quizId);
        int correctAnswers = (int) quizAttemptAnswerRepository.countByAttempt_IdAndCorrectTrue(attemptId);
        int answered = (int) quizAttemptAnswerRepository.countByAttempt_Id(attemptId);
        int wrongAnswers = Math.max(0, answered - correctAnswers);

        return new AttemptResultDto(
                attemptId,
                quizId,
                quiz != null ? quiz.getTitle() : "Quiz",
                total,
                correctAnswers,
                wrongAnswers,
                correctAnswers
        );
    }

    /* ===============================
       REVIEW
       =============================== */

    public ReviewQuestionDto getReviewQuestion(UUID userId, UUID attemptId, int position) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt nicht gefunden"));

        if (!Objects.equals(attempt.getUserId(), userId)) throw new RuntimeException("Kein Zugriff auf diesen Attempt");

        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_IdOrderByPositionAsc(attempt.getQuizId());
        if (questions.isEmpty()) throw new RuntimeException("Quiz hat keine Fragen");

        QuizQuestion q = questions.stream()
                .filter(x -> x.getPosition() == position)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Frage nicht gefunden"));

        QuizAttemptAnswer a = quizAttemptAnswerRepository
                .findByAttempt_IdAndQuestion_Id(attemptId, q.getId())
                .orElseThrow(() -> new RuntimeException("Frage wurde noch nicht beantwortet"));

        return new ReviewQuestionDto(
                q.getId(),
                q.getPosition(),
                q.getQuestion(),
                Arrays.asList(q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()),
                a.getSelectedIndex(),
                q.getCorrectIndex(),
                a.isCorrect(),
                q.getExplanation()
        );
    }

    /* ===============================
       Helpers
       =============================== */

    private int safeTotalQuestions(QuizAttempt attempt, UUID quizId) {
        int total = attempt.getTotalQuestions();
        if (total <= 0 && quizId != null) {
            total = (int) quizQuestionRepository.countByQuiz_Id(quizId);
            attempt.setTotalQuestions(total);
            quizAttemptRepository.save(attempt);
        }
        return total;
    }

    private boolean isFinished(UUID attemptId, UUID quizId, QuizAttempt attempt) {
        int total = safeTotalQuestions(attempt, quizId);
        int answeredCount = (int) quizAttemptAnswerRepository.countByAttempt_Id(attemptId);

        boolean finished = (total > 0 && answeredCount >= total);
        attempt.setFinished(finished);
        return finished;
    }

    private Integer findNextUnansweredPosition(UUID attemptId, UUID quizId) {
        if (quizId == null) return null;

        List<QuizQuestion> questions = quizQuestionRepository.findByQuiz_IdOrderByPositionAsc(quizId);
        if (questions.isEmpty()) return null;

        Set<UUID> answeredQuestionIds = quizAttemptAnswerRepository.findByAttempt_Id(attemptId)
                .stream()
                .map(a -> a.getQuestion().getId())
                .collect(Collectors.toSet());

        for (QuizQuestion q : questions) {
            if (!answeredQuestionIds.contains(q.getId())) {
                return q.getPosition();
            }
        }
        return null;
    }
}