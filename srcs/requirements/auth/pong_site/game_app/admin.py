from django.contrib import admin
from .models import GameSession, GamePlayerProfile, TournamentPlayerProfile
# Register your models here.
# source: https://docs.djangoproject.com/en/5.1/ref/contrib/admin/
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['mode', 'start_date', 'end_date', 'game_duration', 'numbers_of_players']
    list_filter = ['mode', 'end_date', 'numbers_of_players']
    search_fields = ['numbers_of_players', 'mode']
    search_help_text = "Search by mode or number of players"
    ordering = ['-end_date']
    class Meta:
        model = GameSession

admin.site.register(GameSession, GameSessionAdmin)

class GamePlayerProfileAdmin(admin.ModelAdmin):
    list_display = ['get_session_id', 'get_session_mode', 'date_played', 'get_user', 'get_alias', 'win']
    list_filter = ['session__mode', 'win']
    search_fields = ['user__username', 'alias']
    search_help_text = "Search by username or alias"
    empty_value_display = "-"
    ordering = ['-date_played', 'session__id']
    class Meta:
        model = GamePlayerProfile

    def get_session_id(self, obj):
        return obj.session.id
    get_session_id.short_description = 'Session ID'

    def get_session_mode(self, obj):
        return obj.session.mode
    get_session_mode.short_description = 'Session Mode'

    def get_alias(self, obj):
        return obj.alias if obj.alias else "-"
    get_alias.short_description = 'Invited player'

    def get_user(self, obj):
        return obj.user.username if obj.user else "-"
    get_user.short_description = "Registered user"


admin.site.register(GamePlayerProfile, GamePlayerProfileAdmin)

class TournamentPlayerProfileAdmin(admin.ModelAdmin):
    list_display = ['get_session_id', 'date_played', 'get_user', 'get_alias', 'win']
    list_filter = ['win']
    empty_value_display = "-"
    search_fields = ['user__username', 'alias']
    search_help_text = "Search by username or alias"
    ordering = ['-date_played', 'session__id']
    class Meta:
        model = TournamentPlayerProfile

    def get_session_id(self, obj):
        return obj.session.id
    get_session_id.short_description = 'Session ID'

    def get_user(self, obj):
        return obj.user.username if obj.user else "-"
    get_user.short_description = "Registered user"

    def get_alias(self, obj):
        return obj.alias if obj.alias else "-"
    get_alias.short_description = 'Display name'

admin.site.register(TournamentPlayerProfile, TournamentPlayerProfileAdmin)
