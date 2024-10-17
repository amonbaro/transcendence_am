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
        (VERSUS, "versus"),
        (TOURNAMENT, "tournament"),
        (LAST_MAN_STANDING, "last man standing"),
        (BRICK_BREAKER, "brick breaker")
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

    # the front end sends the winner alias which is verified if it's in the players list
    winner_alias = models.CharField(max_length=50)

    # number of player is the len of the players list
    numbers_of_players = models.SmallIntegerField(default=0)

    def __str__(self):
        return f"Game {self.mode} with id {self.id}"

# ----------------------------------------------------------------------------------------------------------------------
# Database register each player in the game session.
# E.g. for a session with 4 players, 4 PlayerProfile objects are created
class PlayerProfile(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player_game', null=True, blank=True)
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='player_game')
    alias = models.CharField(max_length=50)
    date_played = models.DateTimeField(auto_now_add=True)
    win = models.BooleanField(default=False)

    def __str__(self):
        if self.user:
            return f"{self.user.username} is {self.alias}"
        return f"Invited player with alias {self.alias}"
# ----------------------------------------------------------------------------------------------------------------------
#class Game(models.Model):
#    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
#    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='game_session')
#    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE)
#
#    def __str__(self):
#        return f"Game id {self.id} with mode {self.session.mode}"
## ----------------------------------------------------------------------------------------------------------------------
