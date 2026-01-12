package de.quizapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // Die erlaubten Ursprünge (hier die URL deines Frontends in Vercel)
    @Value("${app.cors.allowed-origins:https://projekt-im-berufsfeld.vercel.app}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Erlaubt den angegebenen Ursprung (Frontend URL)
                .allowedOrigins(allowedOrigins.split(","))
                // Erlaubt die angegebenen HTTP-Methoden
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                // Erlaubt alle Header
                .allowedHeaders("*")
                // Erlaubt die Übertragung von Anmeldeinformationen (Cookies)
                .allowCredentials(true);
    }
}