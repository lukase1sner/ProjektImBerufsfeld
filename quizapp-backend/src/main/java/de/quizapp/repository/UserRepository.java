package de.quizapp.repository;

import de.quizapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    User findByAuthUserId(UUID authUserId);

    // optional nützlich (z.B. Admin-Listen / Leaderboard-Alternativen)
    List<User> findAllByRole(String role);
}