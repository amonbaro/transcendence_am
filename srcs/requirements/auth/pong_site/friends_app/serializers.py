from rest_framework import serializers
from .models import FriendRequest #, FriendList
from django.contrib.auth import get_user_model
from django.conf import settings
from user_app.serializers import UserProfileSerializer


User = get_user_model()

#-----------------------------------------------------------------------------------------------------------------------
class FriendRequestSerializer(serializers.ModelSerializer):
    is_active_request = serializers.BooleanField(required=False, read_only=True)
    sender = serializers.UUIDField(required=False, read_only=True)
    timestamp = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'is_active_request', 'are_friends', 'timestamp']

#-----------------------------------------------------------------------------------------------------------------------
class ShowAllSentRequestsSerializer(serializers.ModelSerializer):
    receiver = UserProfileSerializer(read_only=True)
    timestamp = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)

    class Meta:
        model = FriendRequest
        fields = ['id', 'receiver', 'is_active_request', 'are_friends', 'timestamp']

#-----------------------------------------------------------------------------------------------------------------------
class ShowAllReceivedRequestsSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)
    timestamp = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'is_active_request', 'are_friends', 'timestamp']

#-----------------------------------------------------------------------------------------------------------------------
class ShowAllFriendsSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)

    class Meta:
        model = FriendRequest
        fields = ['id', 'friend', 'is_active_request', 'are_friends', 'timestamp']

    def get_friend(self, obj):
        current_user = self.context['request'].user
        # Si l'utilisateur est le sender, on retourne le receiver, sinon on retourne le sender
        if obj.sender == current_user:
            return UserProfileSerializer(obj.receiver, context=self.context).data
        else:
            return UserProfileSerializer(obj.sender, context=self.context).data


#-----------------------------------------------------------------------------------------------------------------------
class UserIdSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=True)

#-----------------------------------------------------------------------------------------------------------------------
class ShowFriendsListSerializer(serializers.ModelSerializer):
    sender = UserProfileSerializer(read_only=True)
    receiver = UserProfileSerializer(read_only=True)
    timestamp = serializers.DateTimeField(required=False, read_only=True, format=settings.DATETIME_FORMAT)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'is_active_request', 'are_friends', 'timestamp']

#-----------------------------------------------------------------------------------------------------------------------