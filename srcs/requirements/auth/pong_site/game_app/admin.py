from django.contrib import admin
from .models import GameSession, PlayerProfile #, Game
# Register your models here.

class GameSessionAdmin(admin.ModelAdmin):
   # list_display = ['mode', 'start_date', 'end_date', 'game_duration', 'winner_alias', 'numbers_of_players']
    list_display = ['mode', 'start_date', 'end_date', 'game_duration', 'numbers_of_players']
    class Meta:
        model = GameSession

admin.site.register(GameSession, GameSessionAdmin)

class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'alias', 'date_played', 'win']
    class Meta:
        model = PlayerProfile

admin.site.register(PlayerProfile, PlayerProfileAdmin)

#class GameAdmin(admin.ModelAdmin):
#    pass
#    class Meta:
#        model = Game
#
#admin.site.register(Game, GameAdmin)