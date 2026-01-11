package de.quizapp.dto;

import java.util.UUID;

public class LeaderboardEntryDto {

    private int rank;
    private UUID userId;
    private String name;
    private long points;
    private boolean currentUser;

    public LeaderboardEntryDto() {}

    public LeaderboardEntryDto(int rank, UUID userId, String name, long points, boolean currentUser) {
        this.rank = rank;
        this.userId = userId;
        this.name = name;
        this.points = points;
        this.currentUser = currentUser;
    }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getPoints() { return points; }
    public void setPoints(long points) { this.points = points; }

    public boolean isCurrentUser() { return currentUser; }
    public void setCurrentUser(boolean currentUser) { this.currentUser = currentUser; }
}