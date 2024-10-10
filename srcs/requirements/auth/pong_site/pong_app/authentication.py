from django.contrib.auth.backends import ModelBackend


# Used in settings.py, SIMPLE_JWT
# 'USER_AUTHENTICATION_RULE': "pong_app.authentication.custom_user_authentication_rule"
# to enable inactif users to login
def custom_user_authentication_rule(user) -> bool:
    # Prior to Django 1.10, inactive users could be authenticated with the
    # default `ModelBackend`.  As of Django 1.10, the `ModelBackend`
    # prevents inactive users from authenticating.  App designers can still
    # allow inactive users to authenticate by opting for the new
    # `AllowAllUsersModelBackend`.  However, we explicitly prevent inactive
    # users from authenticating to enforce a reasonable policy and provide
    # sensible backwards compatibility with older Django versions.
    return True

# source: https://docs.djangoproject.com/fr/5.1/ref/contrib/auth/#django.contrib.auth.backends.ModelBackend
# by default user_can_authenticate() in class ModelBackend does not allow inactive users to authenticate
# it returns False if the user is not active -> can't authenticate
# or True if the user is active -> can authenticate
# This class overrides user_can_authenticate() of ModelBackend class to always return True
# so all users, including inactive users can authenticate
# by setting the user to active if it is not active
class MyCustomModelBackend(ModelBackend):
    def user_can_authenticate(self, user):
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])
            print(f"User {user.username} has been reactivated.")
        return True