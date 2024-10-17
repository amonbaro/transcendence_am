from django.db import models
from django.conf import settings
import uuid


#class FriendList(models.Model):
#    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
#    # one user has one friend list
#    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_friend_list')
#    friends = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='friend_list')
#
#    def __str__(self):
#        return f"{self.user.username}'s friend list"
#
#    def add_friend(self, account ):
#        if not account in self.friends.all():
#            self.friends.add(account)
#            self.save()
#
#    def remove_friend(self, account):
#        if account in self.friends.all():
#            self.friends.remove(account)
#            self.save()
#
#    def unfriend(self, removee):
#        # the person who wants to remove the friend
#        remover = self
#        # remove the friend from both accounts
#        remover.remove_friend(removee)
#        friends_list = FriendList.objects.get(user=removee)
#        friends_list.remove_friend(self.user)
#
#    def is_mutual_friend(self, friend):
#        if friend in self.friends.all():
#            return True
#            return False
#

class FriendRequest(models.Model):
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver')
    is_active_request = models.BooleanField(blank=False, null=False, default=True)
    are_friends = models.BooleanField(blank=False, null=False, default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} sent friendship request to {self.receiver}"

#    def accept(self):
#
#        try:
#         # accept the friend request
#         # update both sender and receiver friend list
#         receiver_friend_list = FriendList.objects.get(user=self.receiver)
#         if receiver_friend_list:
#             receiver_friend_list.add_friend(self.sender)
#             sender_friend_list = FriendList.objects.get(user=self.sender)
#             if sender_friend_list:
#                 sender_friend_list.add_friend(self.receiver)
#                 self.is_active = False
#                 self.save()
#                 return True
#        except Exception as e:
#            return False
#
#    # recevier declines the friend request
#    def decline(self):
#        self.is_active = False
#        self.save()
#
#    # sender cancels the friend request
#    def cancel(self):
#        self.is_active = False
#        self.save()