from django.urls import path
from .views import (
    SendFriendRequestView,
    ShowAllSentRequestsView,
    ShowAllReceivedRequestsView,
    ShowAllFriendsView,
    AcceptFriendRequestView,
    DeclineFriendRequestView,
    CancelFriendRequestView,
    UnfriendView,
)

urlpatterns = [
    path('send-friend-request/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('show-all-sent-requests/', ShowAllSentRequestsView.as_view(), name='show-all-friend-requests'),
    path('show-all-received-requests/', ShowAllReceivedRequestsView.as_view(), name='show-all-friend-requests'),
    path('show-all-friends/', ShowAllFriendsView.as_view(), name='show-all-friends'),
    path('accept-friend-request/', AcceptFriendRequestView.as_view(), name='accept-friend-request'),
    path('decline-friend-request/', DeclineFriendRequestView.as_view(), name='decline-friend-request'),
    path('cancel-friend-request/', CancelFriendRequestView.as_view(), name='cancel-request'),
    path('unfriend/', UnfriendView.as_view(), name='unfriend'),
]
