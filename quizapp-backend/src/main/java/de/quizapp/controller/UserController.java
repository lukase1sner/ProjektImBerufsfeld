package de.quizapp.controller;

import de.quizapp.model.User;
import de.quizapp.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ------------------------------------------------------------
    // BENUTZER ANLEGEN (Admin-Panel)
    // ------------------------------------------------------------
    @PostMapping
    public User createUser(@RequestBody Map<String, String> body) throws Exception {

        String role = body.get("role");
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        String email = body.get("email");
        String password = body.get("password");

        // 1) Supabase User erzeugen
        UUID authId = userService.createSupabaseUser(email, password);

        // 2) User-Objekt für interne DB erzeugen
        User user = new User();
        user.setRole(role);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setAuthUserId(authId);

        // 3) In interner DB speichern
        return userService.createUser(user);
    }

    @GetMapping("/{id}")
    public Object getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/auth/{authUserId}")
    public Object getUserByAuthId(@PathVariable String authUserId) {
        return userService.getUserByAuthUserId(authUserId);
    }

    @GetMapping("/roles")
    public Object getRoles() {
        return userService.getAvailableRoles();
    }
}