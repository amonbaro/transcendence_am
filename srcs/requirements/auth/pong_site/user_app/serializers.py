from email.policy import default
import uuid
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator, validate_image_file_extension
from rest_framework.exceptions import AuthenticationFailed

from .models import User
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .validators import validate_password_match, file_size_validator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

#-----------------------------------------------------------------------------------------------------------------------
# RegisterSerializer: crée un utilisateur à partir des données d'inscription fournies.
# Il s'assure que le mot de passe est traité de manière sécurisée (hashé)
# et qu'il n'est pas visible dans les réponses.
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)
    profile_photo = serializers.ImageField(
        required=False,
        allow_empty_file=True,
        validators=[
            file_size_validator,
            validate_image_file_extension,
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])
        ],
    )
    date_joined = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)
    last_login = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)
    is_active = serializers.BooleanField(required=False, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'password2', 'email', 'first_name', 'last_name', 'profile_photo', 'is_active', 'date_joined', 'last_login']
        read_only_fields = ['image_height', 'image_width']

    def validate(self, attrs):
        validate_password_match(attrs['password'], attrs['password2'])
        return attrs

    def create(self, validated_data):
        # Delete password2 before user creation
        validated_data.pop('password2')

        # Create user in the database
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            profile_photo=validated_data.get('profile_photo')
        )

        # If the user didn't upload a photo, set the default one
        if not user.profile_photo:
            user.profile_photo = 'profile_photos/default/default-user-profile-photo.jpg'
        user.set_password(validated_data['password'])
        user.save()
        return user

#------------------------------------------------------------------------------------------------------------------
# source: https://django-rest-framework-simplejwt.readthedocs.io/en/stable/customizing_token_claims.html
class MyCustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):

        if not user:
            raise AuthenticationFailed("Invalid e-mail or password")

        # Deny access to Django admin users
        if user.is_superuser:
           raise AuthenticationFailed("Django admin users are not allowed to login here.")

        # Set user as online
        user.is_online = True

        # update only the is_online field
        user.save(update_fields=['is_online'])

        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])
            print(f"User {user.username} has been reactivated.")

        token = super().get_token(user) # generate token
        update_last_login(None, user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        # ...
        return token

#-----------------------------------------------------------------------------------------------------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    first_name = serializers.CharField(required=False, allow_blank=False)
    last_name = serializers.CharField(required=False, allow_blank=False)
    profile_photo = serializers.ImageField(
        default='profile_photos/default/default-user-profile-photo.jpg',
        required=False,
        allow_empty_file=True,
        validators=[
            file_size_validator,
            validate_image_file_extension,
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])
        ],
    )
    is_active = serializers.BooleanField(required=False)
    updated_at = serializers.DateTimeField(read_only=True, format=settings.DATETIME_FORMAT)
    date_joined = serializers.DateTimeField(read_only=True, format=settings.DATETIME_FORMAT)
    last_login = serializers.DateTimeField(read_only=True, format=settings.DATETIME_FORMAT)
    delete_photo = serializers.BooleanField(default=False, required=False, write_only=True)
    is_online = serializers.BooleanField(required=False, read_only=True)

    class Meta:
        model = User
        fields = [ 'id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'profile_photo', 'date_joined', 'last_login', 'updated_at', 'delete_photo', 'is_online' ]
        read_only_fields = [ 'image_height', 'image_width']

    def validate(self, data):
        if data.get('delete_photo') and data.get('delete_photo') == True:
            data['profile_photo'] = 'profile_photos/default/default-user-profile-photo.jpg'
        return data

#-----------------------------------------------------------------------------------------------------------------------
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        validate_password_match(attrs['new_password'], attrs['new_password2'])
        return attrs

#-------------------------------------------------------------------------------------------------------------------------
class UserIdSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)
# ----------------------------------------------------------------------------------------------------------------------

class UserProtectedInfoSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(read_only=True, format=settings.DATETIME_FORMAT)
    last_login = serializers.DateTimeField(read_only=True, format=settings.DATETIME_FORMAT)
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_photo', 'is_active', 'date_joined', 'last_login', 'is_online']

class UserProtectedPublicInfoSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(read_only=True, format=settings.DATETIME_FORMAT)
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_photo', 'is_active', 'date_joined', 'is_online']

# ----------------------------------------------------------------------------------------------------------------------

class VerifyUserLoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['email', 'password']