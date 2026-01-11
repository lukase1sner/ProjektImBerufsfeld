package de.quizapp.repository;

import de.quizapp.model.AdminUserView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdminUserViewRepository extends JpaRepository<AdminUserView, Long> {

    // ✅ Für Profil: Email aus View holen
    Optional<AdminUserView> findByAuthUserId(UUID authUserId);

    @Query("""
        select a from AdminUserView a
        where (:role is null or :role = '' or a.role = :role)
          and (:firstName is null or :firstName = '' or lower(a.firstName) like lower(concat('%', :firstName, '%')))
          and (:lastName is null or :lastName = '' or lower(a.lastName) like lower(concat('%', :lastName, '%')))
        order by a.id asc
    """)
    List<AdminUserView> search(
            @Param("role") String role,
            @Param("firstName") String firstName,
            @Param("lastName") String lastName
    );
}