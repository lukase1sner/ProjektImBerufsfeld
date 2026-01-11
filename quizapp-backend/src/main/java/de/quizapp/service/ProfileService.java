package de.quizapp.service;

import de.quizapp.dto.UpdateProfileRequest;
import de.quizapp.dto.UserProfileDto;
import de.quizapp.model.AdminUserView;
import de.quizapp.model.User;
import de.quizapp.repository.AdminUserViewRepository;
import de.quizapp.repository.QuizAttemptAnswerRepository;
import de.quizapp.repository.QuizAttemptRepository;
import de.quizapp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final AdminUserViewRepository adminUserViewRepository;
    private final QuizAttemptAnswerRepository answerRepository;
    private final QuizAttemptRepository attemptRepository;
    private final UserService userService; // enthält updateSupabaseUser()

    public ProfileService(
            UserRepository userRepository,
            AdminUserViewRepository adminUserViewRepository,
            QuizAttemptAnswerRepository answerRepository,
            QuizAttemptRepository attemptRepository,
            UserService userService
    ) {
        this.userRepository = userRepository;
        this.adminUserViewRepository = adminUserViewRepository;
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
        this.userService = userService;
    }

    public UserProfileDto getProfile(UUID authUserId) {
        User u = userRepository.findByAuthUserId(authUserId);
        if (u == null) throw new IllegalStateException("User nicht gefunden.");

        String email = adminUserViewRepository
                .findByAuthUserId(authUserId)
                .map(AdminUserView::getEmail)
                .orElse("");

        long points = answerRepository.getTotalPointsForUser(authUserId);
        long finished = attemptRepository.countByUserIdAndFinishedTrue(authUserId);

        return new UserProfileDto(
                u.getFirstName() == null ? "" : u.getFirstName(),
                u.getLastName() == null ? "" : u.getLastName(),
                email == null ? "" : email,
                points,
                finished
        );
    }

    @Transactional
    public UserProfileDto updateProfile(UUID authUserId, UpdateProfileRequest req) throws Exception {
        User u = userRepository.findByAuthUserId(authUserId);
        if (u == null) throw new IllegalStateException("User nicht gefunden.");

        String first = req.getFirstName() == null ? "" : req.getFirstName().trim();
        String last = req.getLastName() == null ? "" : req.getLastName().trim();
        String email = req.getEmail() == null ? "" : req.getEmail().trim();

        u.setFirstName(first);
        u.setLastName(last);
        userRepository.save(u);

        // ✅ Email in Supabase updaten (wichtig, weil User-Entity keine Email hat)
        if (!email.isBlank()) {
            userService.updateSupabaseUser(authUserId, email, null);
        }

        // return aktueller Stand inkl. Stats
        return getProfile(authUserId);
    }
}