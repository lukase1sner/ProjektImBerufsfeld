package de.quizapp.service;

import de.quizapp.dto.LeaderboardEntryDto;
import de.quizapp.repository.QuizAttemptAnswerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LeaderboardService {

    private final QuizAttemptAnswerRepository answerRepository;

    public LeaderboardService(QuizAttemptAnswerRepository answerRepository) {
        this.answerRepository = answerRepository;
    }

    public List<LeaderboardEntryDto> getLeaderboard(UUID currentUserId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));

        List<QuizAttemptAnswerRepository.LeaderboardRow> rows = answerRepository.getLeaderboardRows();

        List<LeaderboardEntryDto> out = new ArrayList<>();
        int rank = 1;

        for (QuizAttemptAnswerRepository.LeaderboardRow r : rows) {
            if (out.size() >= safeLimit) break;

            UUID userId = r.getUserId();
            long points = r.getPoints();

            String first = r.getFirstName() == null ? "" : r.getFirstName();
            String last = r.getLastName() == null ? "" : r.getLastName();
            String name = (first + " " + last).trim();
            if (name.isBlank()) name = "Unbekannt";

            boolean isMe = currentUserId != null && currentUserId.equals(userId);

            out.add(new LeaderboardEntryDto(rank, userId, name, points, isMe));
            rank++;
        }

        return out;
    }
}