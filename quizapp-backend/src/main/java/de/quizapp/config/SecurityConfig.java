package de.quizapp.config;

import de.quizapp.security.SupabaseBearerAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SupabaseBearerAuthFilter supabaseFilter
    ) throws Exception {

        http
            // 🔴 CORS MUSS vor Security greifen
            .cors(Customizer.withDefaults())

            // CSRF für REST deaktivieren
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                // ✅ Preflight Requests IMMER erlauben
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ✅ Login / Registrierung öffentlich
                .requestMatchers("/api/auth/**").permitAll()

                // 🔐 Geschützte API
                .requestMatchers("/api/**").authenticated()

                // Alles andere (z. B. Actuator, Root) offen
                .anyRequest().permitAll()
            )

            // 🔐 Supabase Bearer Token Filter
            .addFilterBefore(
                supabaseFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}