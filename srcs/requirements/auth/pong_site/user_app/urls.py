from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    RegisterView,
    UserProfileView,
    ChangePasswordView,
    MyCustomTokenBlackListView,
    ShowAllUsersView,
    GetUserFromIDView,
    VerifyUserLoginView
)
from .cron import flush_expired_tokens, show_blacklisted_tokens

app_name = 'user_app'

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='user_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('register/', RegisterView.as_view(), name='user_register'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('logout/', MyCustomTokenBlackListView.as_view(), name='user_logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('flush-expired-tokens/', flush_expired_tokens, name='flush_expired_tokens'),
    path('show-blacklisted-tokens/', show_blacklisted_tokens, name='show_blacklisted_tokens'),
    path('show-all-users/', ShowAllUsersView.as_view(), name='show_all_users'),
    path('get-user-from-id/', GetUserFromIDView.as_view(), name='get_user_from_id'),
    path('verify-user-login/', VerifyUserLoginView.as_view(), name='verify_user_login')
]