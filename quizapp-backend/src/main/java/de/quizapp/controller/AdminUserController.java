package de.quizapp.controller;

import de.quizapp.dto.AdminResetPasswordRequest;
import de.quizapp.dto.AdminUserUpdateRequest;
import de.quizapp.model.AdminUserView;
import de.quizapp.service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<AdminUserView>> list(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName
    ) {
        return ResponseEntity.ok(adminUserService.list(role, firstName, lastName));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AdminUserUpdateRequest req) {
        adminUserService.updateUser(id, req);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody AdminResetPasswordRequest req) {
        adminUserService.resetPassword(id, req);
        return ResponseEntity.ok().build();
    }
}