import uuid
import logging
from django.contrib.auth import get_user_model, login
from django.utils.formats import date_format
from rest_framework.exceptions import ValidationError
from setuptools.command.alias import alias
from .models import GameSession, GamePlayerProfile, TournamentPlayerProfile
from rest_framework import serializers
from django.contrib.auth.validators import UnicodeUsernameValidator

User = get_user_model()
logger = logging.getLogger(__name__)


# ----------------------------------------------------------------------------------------------------------------------
def validate_user_exists(user_id):
    try:
        user = User.objects.get(id=user_id)
        if not user.last_login or not user.is_active:
            raise ValidationError({"error": "User not found."})
        return user
    except User.DoesNotExist:
        raise ValidationError({"error": "User not found."})

# ----------------------------------------------------------------------------------------------------------------------
# UnicodeUsernameValidator: default validator for username: A field validator allowing Unicode characters, in addition to @, ., +, -, and _. The default validator for User.username.
class GamePlayerProfileSerializer(serializers.ModelSerializer):
    alias = serializers.CharField(required=False, allow_null=True,min_length=8, max_length=50, default=None, validators=[UnicodeUsernameValidator()])
    user = serializers.UUIDField(required=False, allow_null=True, default=None)

    class Meta:
        model = GamePlayerProfile
        fields = ['alias', 'user']

    def validate(self, attrs):
        user_id = attrs.get('user')
        alias = attrs.get('alias')

        if user_id and alias:
            raise ValidationError({"error": "Either user or alias must be provided."})
        elif not user_id and not alias:
            raise ValidationError({"error": "Either user or alias must be provided."})
        elif user_id:
            validate_user_exists(user_id)

        return attrs

## ----------------------------------------------------------------------------------------------------------------------
# UnicodeUsernameValidator: default validator for username: A field validator allowing Unicode characters, in addition to @, ., +, -, and _. The default validator for User.username.
class TournamentPlayerProfileSerializer(serializers.ModelSerializer):
    alias = serializers.CharField(required=True, min_length=8, max_length=50, validators=[UnicodeUsernameValidator()])
    user = serializers.UUIDField(required=False, allow_null=True, default=None)

    class Meta:
        model = TournamentPlayerProfile
        fields = ['alias', 'user']

    def validate(self, attrs):
        user_id = attrs.get('user')

        if user_id:
            validate_user_exists(user_id)
        return attrs
# ----------------------------------------------------------------------------------------------------------------------
class GameSessionSerializer(serializers.ModelSerializer):
    mode = serializers.ChoiceField(choices=GameSession.MODE_CHOICES, required=True)

    class Meta:
        model = GameSession
        fields = ['mode']

# ----------------------------------------------------------------------------------------------------------------------
# Parent class that will be used for RegisterGameSessionSerializer and RegisterTournamentSessionSerializer
class BaseGameSessionSerializer(serializers.Serializer):
    session = GameSessionSerializer()
    players = None
    start_date = serializers.CharField(required=True)
    winner1 = serializers.CharField(required=True, max_length=50)
    winner2 = serializers.CharField(required=False, max_length=50, allow_blank=True)

    # Validator: checks if the user is unique
    def validate_user_is_unique(self, players):
        logger.info("validate_user_is_unique")
        unique_ids = set()

        for player in players:
            user_id = player.get('user')
            if user_id:
                if user_id in unique_ids:
                    raise ValidationError({"error": "Each user can only play once in a game session"})
                else:
                    unique_ids.add(user_id)

    # Validator: checks if the alias is unique
    def validate_alias_is_unique(self, players):
        logger.info("validate_alias_is_unique")
        # A set is a collection of unique data, meaning that elements within a set cannot be duplicated.
        unique_alias = set()

        for player in players:
            alias = player.get('alias')
            if alias:
                if alias in unique_alias:
                    raise ValidationError({"error": "Alias must be unique"})
                else:
                    unique_alias.add(alias)

    # Validator: checks if the number of players is within the allowed range
    def validate_player_count(self, players, min_players, max_players):
        logger.info("validate_player_count")
        if len(players) < min_players or len(players) > max_players:
            raise ValidationError({"error": f"Number of players must be between {min_players} and {max_players}."})

    def validate(self, attrs):
        logger.info("BaseGameSessionSerializer validate")
        players = attrs.get('players')

        self.validate_user_is_unique(players)
        self.validate_alias_is_unique(players)
        return attrs

#----------------------------------------------------------------------------------------------------------------------
# Winners may be registered user's username or invited player's alias
class RegisterGameSessionSerializer(BaseGameSessionSerializer):
    players = GamePlayerProfileSerializer(many=True)  # Liste de données sur les joueurs

    # Validator: Compares the winner with user's username or invited player's alias
    def validate_winner_is_player(self, players, winner):
        logger.info("validate_winner_is_player")

        for player in players:

            user_id = player.get('user')
            alias = player.get('alias')

            logger.info(f"looking for winner {winner}")
            logger.info(f"alias is {alias}")
            logger.info(f"user_id is {user_id}")

            if user_id:
                user = validate_user_exists(user_id)
                if user.username == winner:
                    return
            elif alias and alias == winner:
                return

        raise ValidationError({"error": "Winner must be a player in the game"})

    # Validator: If winner2 to is required for this game, checks if winner2 exists, is different from winner1 and is a valid player
    def validate_second_winner(self, winner1, winner2, players):
        logger.info("validate_second_winner")

        if winner2:
            if winner2 == winner1:
                raise ValidationError({"error": "Winners must be different."})
            self.validate_winner_is_player(players, winner2)
        else:
            raise ValidationError({"error": "Winner2 is required for this game mode."})

    # Validator: Winner2 is only allowed for 4 players in versus mode and brick breaker mode
    def validate_game_winner(self, mode, players, winner1, winner2):
        logger.info("validate_game_winner")

        if mode == GameSession.VERSUS or mode == GameSession.BRICK_BREAKER:
            if len(players) == 4:
                self.validate_second_winner(winner1, winner2, players)
        elif winner2:
            raise ValidationError({"error": "Second winner is not allowed for this game"})

    def validate(self, attrs):
        logger.info("RegisterGameSessionSerializer validate")

        # Call the parent class's validate method
        super().validate(attrs)

        # Get attributes
        mode = attrs.get('session').get('mode')
        players = attrs.get('players')
        session = attrs.get('session')
        winner1 = attrs.get('winner1')
        winner2 = attrs.get('winner2')

        # This serializer only supports versus, lastman standing and brick breaker mode
        if session.get('mode') == GameSession.TOURNAMENT:
            raise serializers.ValidationError({"error": "This API supports versus, last man standing and brick breaker mode."})

        # Call the validator of GamePlayerProfileSerializer, because we need to insert either user or alias
        for player in players:
            player_serializer = GamePlayerProfileSerializer(data=player)
            player_serializer.is_valid(raise_exception=True)

        # Number of players must be between 2 and 4 -> method of BaseGameSessionSerializer
        self.validate_player_count(players, 2, 4)

        # At least one winner is required
        self.validate_winner_is_player(players, winner1)

        # Winner2 is not required. Checks if winner2 exists and is valid
        self.validate_game_winner(mode, players, winner1, winner2)
        return attrs

# ----------------------------------------------------------------------------------------------------------------------
# Winners must be an alias of a player in the game, regardless of whether they are registered users
class RegisterTournamentSessionSerializer(BaseGameSessionSerializer):
    players = TournamentPlayerProfileSerializer(many=True)  # Liste de données sur les joueurs

    # Validator: Winner must be alias, never a username. Alias is required for this serializer
    def validate_winner(self, players, winner1):
        logger.info("validate_winner")

        if winner1 not in [player.get('alias') for player in players]:
            raise ValidationError({"error": "Winner must be a player's alias"})

    def validate(self, attrs):
        logger.info("RegisterTournamentSessionSerializer validate")

        # Call the parent class's validate method
        super().validate(attrs)

        # Get attributes
        players = attrs.get('players')
        session = attrs.get('session')
        winner1 = attrs.get('winner1')

        for player_data in players:
            player_serializer = TournamentPlayerProfileSerializer(data=player_data)
            player_serializer.is_valid(raise_exception=True)

        # This serializer only supports tournament mode and requires only one winner
        if session.get('mode') != GameSession.TOURNAMENT:
            raise serializers.ValidationError({"error": "This API supports only tournament mode."})
        if attrs.get('winner2'):
            raise serializers.ValidationError({"error": "Only one winner is allowed in a tournament."})

        # Number of players must be between 2 and 10 -> method of BaseGameSessionSerializer
        self.validate_player_count(players, 2, 10)

        # Winner must be a player in the game
        self.validate_winner(players, winner1)
        return attrs
# ----------------------------------------------------------------------------------------------------------------------

class UserIdSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)
# ----------------------------------------------------------------------------------------------------------------------
