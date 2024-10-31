from django.urls import path
from .views import (
    RegisterGameSessionView,
    RegisterTournamentSessionView,
    ShowOtherUserStatsView,
    ShowCurrentUserStatsView,
    CurrentUserMatchHistoryView,
    OtherUserMatchHistoryView,
 #   ShowAllGamesView,
)

urlpatterns = [
    path('register-game-session/', RegisterGameSessionView.as_view(), name='register-game-session'),
    path('register-tournament-session/', RegisterTournamentSessionView.as_view(), name='register-game-session'),
    path('show-other-user-stats/', ShowOtherUserStatsView.as_view(), name='show-user-stats'),
    path('show-current-user-stats/', ShowCurrentUserStatsView.as_view(), name='show-current-user-stats'),
    path('show-current-user-match-history/', CurrentUserMatchHistoryView.as_view(), name='user-match-history'),
    path('show-other-user-match-history/', OtherUserMatchHistoryView.as_view(), name='user-match-history'),
#    path('show-all-games-history/', ShowAllGamesView.as_view(), name='show-all-games'),
]