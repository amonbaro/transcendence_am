from django.contrib.auth import get_user_model
from django.utils.formats import date_format
from rest_framework.exceptions import ValidationError
from .models import GameSession, PlayerProfile  # , GamePlayer
from rest_framework import serializers

User = get_user_model()

# ----------------------------------------------------------------------------------------------------------------------
# user is not required because invited players may not have an account
class PlayerProfileSerializer(serializers.ModelSerializer):
    alias = serializers.CharField(required=True, max_length=50)
    user = serializers.UUIDField(required=False, allow_null=True, default=None)

    class Meta:
        model = PlayerProfile
        fields = ['alias', 'user']


# ----------------------------------------------------------------------------------------------------------------------
class GameSessionSerializer(serializers.ModelSerializer):
    mode = serializers.ChoiceField(choices=GameSession.MODE_CHOICES, required=True)

    class Meta:
        model = GameSession
        fields = ['mode']


## ----------------------------------------------------------------------------------------------------------------------
#class StartGameSessionSerializer(serializers.Serializer):
#    session = GameSessionSerializer()
#    players = PlayerProfileSerializer(many=True)  # Liste de données sur les joueurs
#
#    def validate(self, attrs):
#        players = attrs.get('players')
#        session = attrs.get('session')
#
#        if session.get('mode') == GameSession.TOURNAMENT and (len(players) < 2 or len(players) > 10):
#            raise serializers.ValidationError({"error": "Number of players must be between 2 and 10."})
#        elif session.get('mode') != GameSession.TOURNAMENT and (len(players) < 2 or len(players) > 4):
#            raise serializers.ValidationError({"error": "Number of players must be between 2 and 4."})
#
#        unique_ids = set()
#        unique_aliases = set()
#
#        for player in players:
#            # -------------------------------------------------------------------------------------
#            alias = player.get('alias')
#            if alias in unique_aliases:
#                raise ValidationError({"error": "Each display name must be unique"})
#            unique_aliases.add(alias)
#            # -------------------------------------------------------------------------------------
#            # user is not required so we need to check if it is present
#            user_id = player.get('user')
#            if user_id:
#                if user_id in unique_ids:
#                    raise ValidationError({"error": "Each user can only play once in a game session"})
#                else:
#                    unique_ids.add(user_id)
#                    try:
#                        user = User.objects.get(id=user_id)
#                    except User.DoesNotExist:
#                        raise ValidationError({"error": f"User with ID {user_id} does not exist."})
#            # -------------------------------------------------------------------------------------
#        return attrs
## ----------------------------------------------------------------------------------------------------------------------

class StartGameSessionSerializer(serializers.Serializer):
    session = GameSessionSerializer()
    players = PlayerProfileSerializer(many=True)  # Liste de données sur les joueurs
    winner_alias = serializers.CharField(required=True, max_length=50)
    winner_alias2 = serializers.CharField(required=False, max_length=50, default=None)
    start_date = serializers.CharField(required=True)

    def validate_second_winner(self, attrs, unique_aliases):
        winner2 = attrs.get('winner_alias2')
        players = attrs.get('players')
        winner1 = attrs.get('winner_alias')
        mode = attrs.get('session').get('mode')

        if mode == GameSession.BRICK_BREAKER or mode == GameSession.VERSUS:
            if len(players) == 4 and not winner2:
                raise ValidationError({"error": "Brick breaker and versus modes require two winners for a 4 players game"})
            elif len(players) != 4 and winner2:
                raise ValidationError({"error": "Two winners are only allowed in a 4 players game"})
            elif len(players) != 4 and not winner2:
                return attrs
            elif winner2 and winner1 == winner2:
                raise ValidationError({"error": "Duplicate winners are not allowed"})
            elif winner2 and winner2 not in unique_aliases:
                raise ValidationError({"error": "Second winner must be one of the players"})
            else:
                return attrs

        if mode != GameSession.BRICK_BREAKER and mode != GameSession.VERSUS and winner2:
            raise ValidationError({"error": "Lastman standing and tournament modes require only one winner"})
        return attrs

    def validate(self, attrs):
        players = attrs.get('players')
        session = attrs.get('session')
        winner = attrs.get('winner_alias')

        # validate the number of players
        if session.get('mode') == GameSession.TOURNAMENT and (len(players) < 2 or len(players) > 10):
            raise serializers.ValidationError({"error": "Number of players must be between 2 and 10."})
        elif session.get('mode') != GameSession.TOURNAMENT and (len(players) < 2 or len(players) > 4):
            raise serializers.ValidationError({"error": "Number of players must be between 2 and 4."})

        # A set is a collection of unique data, meaning that elements within a set cannot be duplicated.
        unique_ids = set()
        unique_aliases = set()

        for player in players:
            # -------------------------------------------------------------------------------------
            alias = player.get('alias')
            if alias in unique_aliases:
                raise ValidationError({"error": "Each display name must be unique"})
            unique_aliases.add(alias)
            # -------------------------------------------------------------------------------------
            # user is not required so we need to check if it is present
            user_id = player.get('user')
            if user_id:
                if user_id in unique_ids:
                    raise ValidationError({"error": "Each user can only play once in a game session"})
                else:
                    unique_ids.add(user_id)
                    try:
                        user = User.objects.get(id=user_id)
                        if not user.last_login or not user.is_active:
                            raise ValidationError({"error" : "User not found"})
                    except User.DoesNotExist:
                        raise ValidationError({"error": "User not found"})
            # -------------------------------------------------------------------------------------
        if winner not in unique_aliases:
            raise ValidationError({"error": f"Winner \"{winner}\" must be one of the players"})

        # Call the method to validate the second winner of an instance of the class
        self.validate_second_winner(attrs, unique_aliases)
        return attrs


# ----------------------------------------------------------------------------------------------------------------------
#
#class RegisterPlayerWinSerializer(serializers.Serializer):
#    session_id = serializers.UUIDField(required=True)
#    alias = serializers.CharField(required=True, max_length=50)
# ----------------------------------------------------------------------------------------------------------------------

class UserIdSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)
# ----------------------------------------------------------------------------------------------------------------------
