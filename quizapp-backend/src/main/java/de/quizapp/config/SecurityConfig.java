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
    SecurityFilterChain securityFilterChain(HttpSecurity http, SupabaseBearerAuthFilter supabaseFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Login bleibt öffentlich
                        .requestMatchers("/api/auth/**").permitAll()
                        // alles unter /api braucht Token
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                // ✅ Supabase Bearer Token Filter (anstatt oauth2ResourceServer/jwk)
                .addFilterBefore(supabaseFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}