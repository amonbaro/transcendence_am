from django.db import models
import uuid
from django.conf import settings


# ----------------------------------------------------------------------------------------------------------------------
class GameSession(models.Model):

    # Constants declaration
    # The front end sends the mode of the game as a string of 2 characters
    VERSUS = "VS"
    TOURNAMENT = "TN"
    LAST_MAN_STANDING = "LS"
    BRICK_BREAKER = "BB"

    # Choices declaration
    # First element of each tuple is the value stored in the database
    # Second element is the human-readable name
    MODE_CHOICES = [
        (VERSUS, "Versus"),
        (TOURNAMENT, "Tournament"),
        (LAST_MAN_STANDING, "Last man Standing"),
        (BRICK_BREAKER, "Brick Breaker")
    ]

    # the id of a session
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)

    # mode of the game is represented by a string of 2 characters
    mode = models.CharField(
        max_length=2,
        choices=MODE_CHOICES,
        default=VERSUS,
    )

    # date started is send by front end
    start_date = models.DateTimeField(blank=True, null=True)

    # date finished is set by back end
    end_date = models.DateTimeField(auto_now_add=True, editable=False)

    # duration is start_date - end_date
    game_duration = models.DurationField(blank=True, null=True)

    # number of player is the len of the players list
    numbers_of_players = models.SmallIntegerField(default=0)

    def __str__(self):
        return f"Game {self.mode} with id {self.id}"

# ----------------------------------------------------------------------------------------------------------------------
# Base model
class BasePlayerProfile(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player_game', null=True, blank=True)
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='player_game')
    date_played = models.DateTimeField(auto_now_add=True)
    win = models.BooleanField(default=False)

# ----------------------------------------------------------------------------------------------------------------------
# Database register each player in the game session (versus, last man or brick breaker).
# E.g. for a session with 4 players, 4 PlayerProfile objects are created
class GamePlayerProfile(BasePlayerProfile):
    alias = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        if self.user:
            return f"Game mode: {self.session.mode} with winner {self.user.username}"
        return f"Game mode: {self.session.mode} with winner invited player"
# ----------------------------------------------------------------------------------------------------------------------
# Database register each player in tournaments
class TournamentPlayerProfile(BasePlayerProfile):
    alias = models.CharField(max_length=50)

    def __str__(self):
        if self.user:
            return f"Tournament mode with winner {self.user.username} as {self.alias}"
        return f"Tournament mode with winner invited player as {self.alias}"
# ----------------------------------------------------------------------------------------------------------------------