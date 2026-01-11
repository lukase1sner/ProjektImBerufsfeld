package de.quizapp.dto;

public class UserProfileDto {
    private String firstName;
    private String lastName;
    private String email;
    private long points;
    private long finishedQuizzes;

    public UserProfileDto() {}

    public UserProfileDto(String firstName, String lastName, String email, long points, long finishedQuizzes) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.points = points;
        this.finishedQuizzes = finishedQuizzes;
    }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public long getPoints() { return points; }
    public void setPoints(long points) { this.points = points; }

    public long getFinishedQuizzes() { return finishedQuizzes; }
    public void setFinishedQuizzes(long finishedQuizzes) { this.finishedQuizzes = finishedQuizzes; }
}