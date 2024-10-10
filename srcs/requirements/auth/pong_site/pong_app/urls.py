from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView,
    UserProfileView,
    ChangePasswordView, MyCustomTokenBlackListView,
)
#from .cron import flush_expired_tokens, show_blacklisted_tokens

app_name = 'pong_app'

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='user_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='user_register'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('logout/', MyCustomTokenBlackListView.as_view(), name='user_logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
#    path('flush/', flush_expired_tokens, name='flush_expired_tokens'),
#    path('show/', show_blacklisted_tokens, name='show_blacklisted_tokens'),
]