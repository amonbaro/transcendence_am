from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from .models import FriendRequest
from .serializers import (
    FriendRequestSerializer,
    ShowAllSentRequestsSerializer,
    ShowAllReceivedRequestsSerializer,
    UserIdSerializer,
    ShowAllFriendsSerializer,
)
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

# Get a reference of the custom user model
User = get_user_model()

def are_friends(user1, user2):
    if FriendRequest.objects.filter(sender=user1, receiver=user2, are_friends=True).exists() or \
            FriendRequest.objects.filter(sender=user2, receiver=user1, are_friends=True).exists():
        return True
    else:
        return False

#-----------------------------------------------------------------------------------------------------------------------
# CreateAPIView uses only POST requests
class SendFriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Create a serializer instance with the data sent in the request
        receiver_id_serializer = UserIdSerializer(data=request.data)

        # If the data is not valid, raise an exception
        receiver_id_serializer.is_valid(raise_exception=True)

        # get receiver's id
        receiver_id = receiver_id_serializer.validated_data['user_id']

        # get sender is the current user
        sender = self.request.user

        try:
            # get receiver's user object from the id
            receiver = User.objects.get(id=receiver_id)

            # Check if receiver and sender are the same
            if sender == receiver:
                raise ValidationError({"error": "You can't send a friend request to yourself."})
            # Check if they are already friends
            elif FriendRequest.objects.filter(sender=sender, receiver=receiver, are_friends=True).exists() or \
               FriendRequest.objects.filter(sender=receiver, receiver=sender, are_friends=True).exists():
                    raise ValidationError({"error": "You are already friends with this user."})
            # Check if the friend request has already been sent by the sender
            elif FriendRequest.objects.filter(sender=sender, receiver=receiver, is_active_request=True).exists():
                raise ValidationError({"error": "You have already sent a friendship request to this user."})
            # Check if the friend request has already been sent by the receiver
            elif FriendRequest.objects.filter(sender=receiver, receiver=sender, is_active_request=True).exists():
                raise ValidationError({"error": "You have already received a friendship request from this user."})
            # If all conditions are good, send the friend request
            else:
                FriendRequest.objects.create(sender=sender, receiver=receiver, is_active_request=True, are_friends=False)
                return Response({"message": "Friend request has been sent successfully."}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({"error": f"User with id \"{receiver_id}\" not found."}, status=status.HTTP_404_NOT_FOUND)


#-----------------------------------------------------------------------------------------------------------------------
class ShowAllSentRequestsView(generics.ListAPIView):
    serializer_class = ShowAllSentRequestsSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']

    def get_queryset(self):
        return FriendRequest.objects.filter(sender=self.request.user, receiver__is_active=True, is_active_request=True, are_friends=False)


#-----------------------------------------------------------------------------------------------------------------------
class ShowAllReceivedRequestsView(generics.ListAPIView):
    serializer_class = ShowAllReceivedRequestsSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']

    def get_queryset(self):
        return FriendRequest.objects.filter(receiver=self.request.user, sender__is_active=True, is_active_request=True, are_friends=False)


#-----------------------------------------------------------------------------------------------------------------------
class ShowAllFriendsView(generics.ListAPIView):
    serializer_class = ShowAllFriendsSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get']

    def get_queryset(self):
        current_user = self.request.user
        return FriendRequest.objects.filter(
            (Q(receiver=current_user) & Q(sender__is_active=True)) |
            (Q(sender=current_user) & Q(receiver__is_active=True)),
            is_active_request=False,
            are_friends=True
        )

#-----------------------------------------------------------------------------------------------------------------------
class AcceptFriendRequestView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['patch']

    def update(self, request, *args, **kwargs):
        # Create a serializer instance with the data sent in the request
        serializer = UserIdSerializer(data=request.data)

        # If the data is not valid, raise an exception
        serializer.is_valid(raise_exception=True)

        # get sender's id
        sender_id = serializer.validated_data['user_id']

        # Get a reference of the custom user model
        User = get_user_model()

        # The current user is the receiver. He will accept the friendship request
        current_user = self.request.user

        try:
            # Get sender's user object from the id
            sender = User.objects.get(id=sender_id)
            if not sender.is_active:
                raise ValidationError({"error": "User not active."})
            friend_request = FriendRequest.objects.get(sender=sender, receiver=current_user, is_active_request=True, are_friends=False)
            friend_request.is_active_request = False
            friend_request.are_friends = True
            friend_request.timestamp = timezone.now()
            friend_request.save()
            return Response({"message": "Friend request has been accepted successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)




#-----------------------------------------------------------------------------------------------------------------------
class DeclineFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['delete']

    def delete(self, request, *args, **kwargs):
        # Create a serializer instance with the data sent in the request
        serializer = UserIdSerializer(data=request.data)

        # If the data is not valid, raise an exception
        serializer.is_valid(raise_exception=True)

        # get sender's id
        sender_id = serializer.validated_data['user_id']

        # Get a reference of the custom user model
        User = get_user_model()

        # Get the current user
        receiver = request.user

        try:
            # get receiver's user object from the id. if it doesn't exist, raise an exception
            sender = User.objects.get(id=sender_id)
            friend_request = FriendRequest.objects.get(sender=sender, receiver=receiver, is_active_request=True, are_friends=False)
            friend_request.delete()
            return Response({"message": "Friend request has been declined."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)


#-----------------------------------------------------------------------------------------------------------------------
class CancelFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['delete']

    def delete(self, request, *args, **kwargs):
        # Create a serializer instance with the data sent in the request
        serializer = UserIdSerializer(data=request.data)

        # If the data is not valid, raise an exception
        serializer.is_valid(raise_exception=True)

        # get receiver's id
        receiver_id = serializer.validated_data['user_id']

        # Get a reference of the custom user model
        User = get_user_model()

        # Get the current user
        sender = request.user

        try:
            # get receiver's user object from the id
            receiver = User.objects.get(id=receiver_id)
            if not receiver.is_active:
                raise ValidationError({"error": "User not active."})
            friend_request = FriendRequest.objects.get(sender=sender, receiver=receiver, is_active_request=True, are_friends=False)
            friend_request.delete()
            return Response({"message": "Friend request has been canceled."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Receiver not found."}, status=status.HTTP_404_NOT_FOUND)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)


#-----------------------------------------------------------------------------------------------------------------------
class UnfriendView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ['delete']

    def delete(self, request, *args, **kwargs):
        # Create a serializer instance with the data sent in the request
        serializer = UserIdSerializer(data=request.data)

        # If the data is not valid, raise an exception
        serializer.is_valid(raise_exception=True)

        # Get the id of the user to be unfriended
        user_id = request.data.get('user_id')

        # Get a reference of the custom user model
        User = get_user_model()

        # Get the current user
        current_user = self.request.user


        try:
            # firstly get user object of the friend to be deleted
            other_user = User.objects.get(id=user_id)
            if not other_user.is_active:
                raise ValidationError({"error": "User not active."})
            try:
                # then try to find a friendship where the sender is current user and the receiver is the other user
                friendship = FriendRequest.objects.get( sender=current_user,
                                                        receiver=other_user,
                                                        are_friends=True )
                friendship.delete()
                return Response({"message": "Friendship has been removed successfully."}, status=status.HTTP_200_OK)
            # if the friendship is not found
            except FriendRequest.DoesNotExist:
                # try to find a friendship where the sender is the other user and the receiver is the current user
                try:
                    friendship = FriendRequest.objects.get( sender=other_user,
                                                            receiver=current_user,
                                                            are_friends=True )
                    friendship.delete()
                    return Response({"message": "Friendship has been removed successfully."}, status=status.HTTP_200_OK)
                # if the friendship is not found in any try section, return an error
                except FriendRequest.DoesNotExist:
                    return Response({"error": "Friend not found."}, status=status.HTTP_404_NOT_FOUND)
        # if the user object to be deleted is not found, return an error
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

#-----------------------------------------------------------------------------------------------------------------------