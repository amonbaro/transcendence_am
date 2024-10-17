from datetime import datetime

from django.db.models.expressions import result
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import generics, settings
from rest_framework.views import APIView
from .models import GameSession, PlayerProfile
from .serializers import StartGameSessionSerializer, UserIdSerializer #,  RegisterPlayerWinSerializer
from django.contrib.auth import get_user_model
from rest_framework import status
from friends_app.models import FriendRequest
from user_app.models import User
from friends_app.views import are_friends

User = get_user_model()


## ----------------------------------------------------------------------------------------------------------------------
#class StartGameSessionView(generics.CreateAPIView):
#    serializer_class = StartGameSessionSerializer
#
#    def create(self, request, *args, **kwargs):
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#
#        mode = serializer.validated_data['session']
#        players = serializer.validated_data['players']
#
#        session = GameSession.objects.create(mode=mode.get('mode'), numbers_of_players=len(players))
#
#        for player in players:
#            if player['user'] is None:
#                user = None
#            else:
#                user_id = player['user']
#                user = User.objects.get(id=user_id)
#            PlayerProfile.objects.create(alias=player['alias'], session=session, user=user)            
#        return Response({"session_id": session.id}, status=status.HTTP_201_CREATED)
## ----------------------------------------------------------------------------------------------------------------------
#
#class RegisterPlayerWinView(generics.UpdateAPIView):
#    serializer_class = RegisterPlayerWinSerializer
#    http_method_names = ['patch']
#
#    def patch(self, request, *args, **kwargs):
#        serializer = self.get_serializer(data=request.data)
#        serializer.is_valid(raise_exception=True)
#        session_id = serializer.validated_data.get('session_id')
#        alias = serializer.validated_data.get('alias')
#
#        try:
#            session = GameSession.objects.get(id=session_id)
#        except GameSession.DoesNotExist:
#            return Response({"error": f"Game session {session_id} not found."}, status=status.HTTP_404_NOT_FOUND)
#
#        try:
#            player = PlayerProfile.objects.get(session=session, alias=alias)
#        except PlayerProfile.DoesNotExist:
#            return Response({"error": f"Player with display name {alias} not found in session {session_id}."}, status=status.HTTP_404_NOT_FOUND)
#
#        player.win = True
#        player.save()
#        return Response({"winner_id": f"{player.user.id} in game {session_id}."}, status=status.HTTP_200_OK)
#
# ----------------------------------------------------------------------------------------------------------------------

def format_duration(duration):
    total_secondes = duration.total_seconds()
    days = total_secondes // (24 * 3600)
    hours = (total_secondes % (24 * 3600)) / 3600
    minutes = (total_secondes % 3600) / 60
    seconds = total_secondes % 60

    if int(days) == 0 and int(hours) == 0 and int(minutes) == 0:
        return f"{int(seconds)} sec"
    elif int(days) == 0 and int(hours) == 0:
        return f"{int(minutes)} min {int(seconds)} sec"
    elif int(days) == 0:
        return f"{int(hours)} hrs {int(minutes)} min {int(seconds)} sec"
    else:
        return f"{int(days)} d, {int(hours)} hrs {int(minutes)} min {int(seconds)} sec"

# ----------------------------------------------------------------------------------------------------------------------

class RegisterGameSessionView(generics.CreateAPIView):
    serializer_class = StartGameSessionSerializer
    permission_classes = [AllowAny]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mode = serializer.validated_data['session']
        players = serializer.validated_data['players']
        winner_alias = serializer.validated_data['winner_alias']

        end_date = datetime.now()
        try:
            start_date = datetime.strptime(serializer.validated_data['start_date'], "%d/%m/%Y %H:%M:%S")
            diff = end_date - start_date
        except ValueError:
            return Response({"error": "Invalid date format. Please use 'dd/mm/yyyy HH:MM:SS'"}, status=status.HTTP_400_BAD_REQUEST)

        session = GameSession.objects.create(mode=mode.get('mode'), numbers_of_players=len(players), game_duration=diff, start_date=start_date, winner_alias=winner_alias)

        for player in players:
            if player['user'] is None:
                user = None
            else:
                user_id = player['user']
                user = User.objects.get(id=user_id)
            if player['alias'] == winner_alias:
                PlayerProfile.objects.create(alias=player['alias'], session=session, user=user, win=True)
            else:
                PlayerProfile.objects.create(alias=player['alias'], session=session, user=user)

        # Get the winner profile to access the user id. We need to return the winner id in the response
        winner_profile = PlayerProfile.objects.get(session=session, alias=winner_alias)

        # If the winner is registered user -> get the id, else -> return NONE
        winner_id = winner_profile.user.id if winner_profile.user else None

        return Response({"session_id": session.id, "winner_id": winner_id }, status=status.HTTP_201_CREATED)

# ----------------------------------------------------------------------------------------------------------------------

def get_user_stats(user):
    # initialize the result as dictionary.
    result = {}

    player_profiles = PlayerProfile.objects.filter(user=user)
    total_games_played = player_profiles.count()
    total_games_won = player_profiles.filter(win=True).count()

    versus_played = player_profiles.filter(session__mode=GameSession.VERSUS).count()
    versus_won = player_profiles.filter(session__mode=GameSession.VERSUS, win=True).count()

    tournament_played = player_profiles.filter(session__mode=GameSession.TOURNAMENT).count()
    tournament_won = player_profiles.filter(session__mode=GameSession.TOURNAMENT, win=True).count()

    last_man_standing_played = player_profiles.filter(session__mode=GameSession.LAST_MAN_STANDING).count()
    last_man_standing_won = player_profiles.filter(session__mode=GameSession.LAST_MAN_STANDING, win=True).count()

    brick_breaker_played = player_profiles.filter(session__mode=GameSession.BRICK_BREAKER).count()
    brick_breaker_won = player_profiles.filter(session__mode=GameSession.BRICK_BREAKER, win=True).count()

    result['total_games_played'] = total_games_played
    result['total_games_won'] = total_games_won
    result['versus_played'] = versus_played
    result['versus_won'] = versus_won
    result['tournament_played'] = tournament_played
    result['tournament_won'] = tournament_won
    result['last_man_standing_played'] = last_man_standing_played
    result['last_man_standing_won'] = last_man_standing_won
    result['brick_breaker_played'] = brick_breaker_played
    result['brick_breaker_won'] = brick_breaker_won

    return result

# ----------------------------------------------------------------------------------------------------------------------

class ShowOtherUserStatsView(APIView):
    permission_classes = [AllowAny]
    http_method_names = ['post']
    def post(self, request, *args, **kwargs):
        serializer = UserIdSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other_user_id = serializer.validated_data.get('user_id')
        is_friend = False
        try:
            # Get other user instance. If not found -> raise exception 404
            other_user = User.objects.get(id=other_user_id)
            result = {}

            # Check for errors
            if not other_user.last_login:
                return Response({"error": "User has never logged in."}, status=status.HTTP_400_BAD_REQUEST)
            # permission_classes checks if user is active ???
            elif not other_user.is_active:
                return Response({"error": "User is not active."}, status=status.HTTP_404_NOT_FOUND)

            # always add username no matter if the request is authenticated or not
            result['username'] = other_user.username

            # if the request is authenticated -> add info about the friend status, first_name and last_name
            if request.user.is_authenticated:
                if other_user == request.user:
                    return Response({"error": "Call show-current-user-stats."}, status=status.HTTP_400_BAD_REQUEST)
                if are_friends(request.user, other_user):
                    is_friend = True
                result['first_name'] = other_user.first_name
                result['last_name'] = other_user.last_name
                result['is_online'] = other_user.is_online
                result['is_friend'] = is_friend

            # Get user stats
            user_stats = get_user_stats(other_user)

            # Add user stats to the result
            result.update(user_stats)

            return Response(result, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

# ----------------------------------------------------------------------------------------------------------------------

class ShowCurrentUserStatsView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        current_user = request.user

        # permission_classes checks if user is active ???
        if not current_user.is_active:
            return Response({"error": "User is not active."}, status=status.HTTP_404_NOT_FOUND)

        return Response( get_user_stats(current_user), status=status.HTTP_200_OK)

# ----------------------------------------------------------------------------------------------------------------------

class CurrentUserMatchHistoryView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        user = request.user

        # permission_classes checks if user is active ???
        if not user.is_active:
            return Response({"error": "User is not active."}, status=status.HTTP_404_NOT_FOUND)

        player_profiles = PlayerProfile.objects.filter(user=user)
        match_history = []
        for player in player_profiles:
            match_history.append(
                {
                    "mode": player.session.mode,
                    "date_played": player.session.start_date.strftime('%d %b %Y'),
                    "duration": format_duration(player.session.game_duration),
                    "alias": player.alias,
                    "number_of_players": player.session.numbers_of_players,
                    "result": "win" if player.win else "lost"
                }
            )
        return Response(match_history, status=status.HTTP_200_OK)
# ----------------------------------------------------------------------------------------------------------------------

class OtherUserMatchHistoryView(APIView):
    http_method_names = ['post']
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        serializer = UserIdSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other_user_id = serializer.validated_data.get('user_id')
        try:
            other_user = User.objects.get(id=other_user_id)

            if other_user == request.user:
                return Response({"error": "Call show-current-user-match-history."}, status=status.HTTP_400_BAD_REQUEST)
            # permission_classes checks if user is active ???
            elif not other_user.is_active:
                return Response({"error": "User is not active."}, status=status.HTTP_404_NOT_FOUND)
            elif not other_user.last_login:
                return Response({"error": "User has never logged in."}, status=status.HTTP_404_NOT_FOUND) # should be HTTP_404_NOT_FOUND
            elif not are_friends(request.user, other_user):
                return Response({"error": "User is not your friend."}, status=status.HTTP_401_UNAUTHORIZED)

            player_profiles = PlayerProfile.objects.filter(user=other_user)
            match_history = []
            for player in player_profiles:
                match_history.append(
                    {
                        "mode": player.session.mode,
                        "date_played": player.session.start_date.strftime('%d %b %Y'),
                        "duration": format_duration(player.session.game_duration),
                        "alias": player.alias,
                        "number_of_players": player.session.numbers_of_players,
                        "result": "win" if player.win else "lost"
                    }
                )
            return Response(match_history, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
# ----------------------------------------------------------------------------------------------------------------------

class ShowAllGamesView(generics.ListAPIView):
    http_method_names = ['get']
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        game_sessions = GameSession.objects.all()
        game_sessions_list = []

        for session in game_sessions:
            winner = PlayerProfile.objects.get(session=session, win=True)

            if winner.user:
                winner_username = winner.user.username if winner.user.is_active else "deactivated user"
            else:
                winner_username = "invited player"

            game_sessions_list.append(
                {
                    "mode": session.mode,
                    "date_played": session.start_date.strftime('%d %b %Y'),
                    "game_duration": format_duration(session.game_duration),
                    "number_of_players": session.numbers_of_players,
                    "winner_alias": session.winner_alias,
                    "winner_username": winner_username,
               }
            )
        return Response(game_sessions_list, status=status.HTTP_200_OK)