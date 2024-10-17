import logging
from rest_framework_simplejwt.views import TokenBlacklistView
from rest_framework import (
    generics,
    status,
    request
)
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.password_validation import password_changed
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

#-----------------------------------------------------------------------------------------------------------------------
class MyCustomTokenBlackListView(TokenBlacklistView):
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        # Appelle la méthode par défaut de TokenBlacklistView
        response = super().post(request, *args, **kwargs)

        # Vérifie si le statut est 200 (succès)
        if response.status_code == status.HTTP_200_OK:
            custom_response_data = {"message": "Token successfully blacklisted."}
            custom_response_data.update(response.data)  # Ajoute les données originales
            return Response(custom_response_data, status=status.HTTP_200_OK)
        else:
            return response

#-----------------------------------------------------------------------------------------------------------------------
# RegisterView : uses RegisterViewSerializer to validates data and create a new user
# accepts HTTP requests
class RegisterView(generics.CreateAPIView):
    http_method_names = ['post']
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    queryset = User.objects.all()

#-----------------------------------------------------------------------------------------------------------------------
# UserProfileView: PUT, PATCH, GET requests because RetrieveUpdateDestroyAPIView is used
# POST is not allowed
# update is automatically done by the RetrieveUpdateAPIView
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Renvoie l'utilisateur connecté (self.request.user)
        return self.request.user

#-----------------------------------------------------------------------------------------------------------------------
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    http_method_names = ['post']

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

            # Set the new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            password_changed(serializer.data.get("new_password"), user=user)
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#-----------------------------------------------------------------------------------------------------------------------

class ShowAllUsersView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(is_active=True).exclude(last_login__isnull=True).exclude(is_superuser=True).exclude(id=user.id)

