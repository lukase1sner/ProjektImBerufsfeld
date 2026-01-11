package de.quizapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan("de.quizapp")
public class QuizappBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuizappBackendApplication.class, args);
    }
}