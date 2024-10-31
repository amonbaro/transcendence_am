from datetime import datetime
import pytz
from django.utils.timezone import localtime
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import generics, settings
from rest_framework.views import APIView
from .models import GameSession, GamePlayerProfile, TournamentPlayerProfile
from .serializers import RegisterGameSessionSerializer, RegisterTournamentSessionSerializer, UserIdSerializer, logger
from django.contrib.auth import get_user_model
from rest_framework import status
from friends_app.models import FriendRequest
from user_app.models import User
from friends_app.views import are_friends
from itertools import chain
from django.utils import timezone

User = get_user_model()

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

# to add query sets : https://sentry.io/answers/combine-querysets-django/
def get_user_stats(user):
    # initialize the result as dictionary.
    result = {}

    game_player_profiles = GamePlayerProfile.objects.filter(user=user)
    tournament_player_profiles = TournamentPlayerProfile.objects.filter(user=user)

    result['total_played'] = game_player_profiles.count() + tournament_player_profiles.count()
    result['total_wins']  = game_player_profiles.filter(win=True).count() + tournament_player_profiles.filter(win=True).count()

    for mode in GameSession.MODE_CHOICES:
        total = game_player_profiles.filter(session__mode=mode[0]).count()
        result[f'{mode[0]}_played'] = total if total else 0
        wins = game_player_profiles.filter(session__mode=mode[0], win=True).count()
        result[f'{mode[0]}_wins'] = wins if wins else 0

    result['TN_played'] = tournament_player_profiles.count()
    result['TN_wins'] = tournament_player_profiles.filter(win=True).count()
    return result

# ----------------------------------------------------------------------------------------------------------------------

def get_user_match_history(user):
    game_player_profiles = GamePlayerProfile.objects.filter(user=user)

    # initialize the result as list.
    match_history = []

    for player in game_player_profiles:
        if player.session.numbers_of_players == 4 and (player.session.mode == 'VS' or player.session.mode == 'BB'):
            if player.win:
                teammate = GamePlayerProfile.objects.filter(session=player.session, win=True).exclude(id=player.id).first()
            else:
                teammate = GamePlayerProfile.objects.filter(session=player.session, win=False).exclude(id=player.id).first()
            match_history.append(
                {
                    "mode": player.session.mode,
                    "date_played": localtime(player.date_played).strftime('%d %b %Y %H:%M:%S'),
                    "duration": format_duration(player.session.game_duration),
                    "number_of_players": player.session.numbers_of_players,
                    "teammate" : teammate.alias if teammate.alias else teammate.user.username,
                    "result": "win" if player.win else "lost"
                }
            )
        else:
            match_history.append(
                {
                    "mode": player.session.mode,
                    "date_played": localtime(player.date_played).strftime('%d %b %Y %H:%M:%S'),
                    "duration": format_duration(player.session.game_duration),
                    "number_of_players": player.session.numbers_of_players,
                    "result": "win" if player.win else "lost"
                }
            )
    tournament_player_profiles = TournamentPlayerProfile.objects.filter(user=user)
    for player in tournament_player_profiles:
        match_history.append(
            {
                "mode": "TN",
                "date_played": localtime(player.date_played).strftime('%d %b %Y %H:%M:%S'),
                "duration": format_duration(player.session.game_duration),
                "number_of_players": player.session.numbers_of_players,
                "display_name": player.alias,
                "result": "win" if player.win else "lost"
            }
        )
    match_history = sorted(match_history, key=lambda x: x['date_played'], reverse=True)
    return match_history

# ----------------------------------------------------------------------------------------------------------------------

class AbstractRegisterSessionView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = None

    class Meta:
        abstract = True

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mode = serializer.validated_data['session']
        players = serializer.validated_data['players']
        winner1 = serializer.validated_data['winner1']
        winner2 = serializer.validated_data.get('winner2')
        end_date = datetime.now()

        try:
            # front-end send the start_date in a string with format 'dd/mm/yyyy HH:MM:SS'
            # strptime: creates a datetime object from the given string.
            # if the format (second argument of strptime) doesn't match the string(first argument), exception is raised.
            start_date = datetime.strptime(serializer.validated_data['start_date'], "%d/%m/%Y %H:%M:%S")
            if start_date > end_date:
                return Response({"error": "Invalid date format. Start date is in the future."}, status=status.HTTP_400_BAD_REQUEST)
            diff = end_date - start_date
            logger.info(f"start_date: {start_date}, end_date: {end_date}, diff: {diff}")
        except ValueError:
            return Response({"error": "Invalid date format. Please use 'dd/mm/yyyy HH:MM:SS'"}, status=status.HTTP_400_BAD_REQUEST)

        session = self.create_session(mode, players, diff, start_date)

        self.register_players(session, players, winner1, winner2)

        return Response({"message": "Game session registered successfully!"}, status=status.HTTP_201_CREATED)

    def create_session(self, mode, players, diff, start_date):
        return GameSession.objects.create(mode=mode.get('mode'), numbers_of_players=len(players), game_duration=diff, start_date=start_date)

    def register_players(self, session, players, winner1, winner2):
        raise NotImplementedError

# ----------------------------------------------------------------------------------------------------------------------

class RegisterGameSessionView(AbstractRegisterSessionView):
    serializer_class = RegisterGameSessionSerializer

    def register_players(self, session, players, winner1, winner2):
        for player in players:
            try:
                user_id = player['user']
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                user = None

            display_name = user.username if user else player['alias']
            is_winner = bool(display_name == winner1 or (winner2 and display_name == winner2))

            GamePlayerProfile.objects.create(alias=player['alias'], session=session, user=user, date_played=session.start_date, win=is_winner)

# ----------------------------------------------------------------------------------------------------------------------

class RegisterTournamentSessionView(AbstractRegisterSessionView):
    serializer_class = RegisterTournamentSessionSerializer

    def register_players(self, session, players, winner1, winner2):
        for player in players:
            try:
                user_id = player['user']
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                user = None

            is_winner = bool(player['alias'] == winner1)
            TournamentPlayerProfile.objects.create(alias=player['alias'], session=session, user=user, date_played=session.start_date, win=is_winner)

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

            # Check for errors
            if not other_user.is_active or not other_user.last_login:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            # Get user stats
            user_stats = get_user_stats(other_user)

            return Response(user_stats, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

# ----------------------------------------------------------------------------------------------------------------------

class ShowCurrentUserStatsView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        current_user = request.user

        # permission_classes checks if user is active ???
        if not current_user.is_active or not current_user.last_login:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response( get_user_stats(current_user), status=status.HTTP_200_OK)


# ----------------------------------------------------------------------------------------------------------------------
class CurrentUserMatchHistoryView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        current_user = request.user

        # permission_classes checks if user is active ???
        if not current_user.is_active or not current_user.last_login:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        match_history = get_user_match_history(current_user)
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
            elif not other_user.is_active or not other_user.last_login:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            elif not are_friends(request.user, other_user):
                return Response({"error": "User is not your friend."}, status=status.HTTP_401_UNAUTHORIZED)

            match_history = get_user_match_history(other_user)
            return Response(match_history, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
# ----------------------------------------------------------------------------------------------------------------------
#class ShowAllGamesView(generics.ListAPIView):
#    permission_classes = [AllowAny]
#    def get(self, request, *args, **kwargs):
#
#        match_history = []
#        players = GamePlayerProfile.objects.all()
#        for player in players:
#            if player.session.numbers_of_players == 4 and (player.session.mode == 'VS' or player.session.mode == 'BB'):
#                if player.win:
#                    teammate = GamePlayerProfile.objects.filter(session=player.session, win=True).exclude(id=player.id).first()
#                else:
#                    teammate = GamePlayerProfile.objects.filter(session=player.session, win=False).exclude(id=player.id).first()
#                match_history.append(
#                    {
#                        "mode": player.session.mode,
#                        "date_played": localtime(player.date_played).strftime('%d %b %Y %H:%M:%S'),
#                        "duration": format_duration(player.session.game_duration),
#                        "number_of_players": player.session.numbers_of_players,
#                        "teammate" : teammate.alias if teammate.alias else teammate.user.username,
#                        "result": "win" if player.win else "lost"
#                    }
#                )
#            else:
#                match_history.append(
#                    {
#                        "mode": player.session.mode,
#                        "date_played": localtime(player.date_played).strftime('%d %b %Y %H:%M:%S'),
#                        "duration": format_duration(player.session.game_duration),
#                        "number_of_players": player.session.numbers_of_players,
#                        "result": "win" if player.win else "lost"
#                    }
#                )
#        return Response(match_history, status=status.HTTP_200_OK)