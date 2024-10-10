from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
import os

# create a custom user model with all fields and methods
# of the default User model ( inheritance from AbstractUser)
# additional fields and methods can be added later
class User(AbstractUser):
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_groups',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions',
        blank=True,
    )
    #groups = models.ManyToManyField(Group, related_name="custom_user_set", blank=True)
    #user_permissions = models.ManyToManyField(Permission, related_name="custom_user_set", blank=True)
    # checks the value for a valid email address using EmailValidator.
    # unique = True: each e-mail in database must be unique.
    # if it's not unqiue: exception IntegrityError
    # The default User model doesn't have the unique parameter
    email = models.EmailField(unique=True)

    # USERNAME_FIELD: email will be used for authentication
    # the default is username
    USERNAME_FIELD = 'email'

    # for image field pillow is installed and MEDIA and MEDIA_ROOT are set in settings.py
    profile_photo = models.ImageField(
        upload_to='profile_photos/users/',
        default='profile_photos/default/default-user-profile-photo.jpg',
        height_field='image_height',
        width_field='image_width',
        # This is the max length of varchar stored in the database, default is 100
        max_length=255,
    )
    image_height = models.PositiveSmallIntegerField(null=True, blank=True, editable=False)
    image_width = models.PositiveSmallIntegerField(null=True, blank=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    # A list of the field names that will be prompted for when creating a user via the
    # createsuperuser management command. The user will be prompted to supply a value for
    # each of these fields. It must include any field for which blank is False
    # 'USERNAME_FIELD' and 'password'  must not be included in 'REQUIRED_FIELDS'
    # This means that email should not be included in REQUIRED_FIELDS
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    # The save() method is overridden to delete the old profile photo if the user changes it
    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        # If the instance of a user exists (pk = primary key)
        if self.pk:
            try:
                current = User.objects.get(pk=self.pk)
                # If the user deleted his current profile photo, return the default one
                if not self.profile_photo or self.profile_photo.name == "":
                    self.profile_photo = 'profile_photos/default/default-user-profile-photo.jpg'
                # If the user didn't change his profile photo, return the current one
                # If the user change his profile photo, delete the old one
                # Default photo can't be deleted
                elif current.profile_photo and current.profile_photo != self.profile_photo:
                    if os.path.basename(current.profile_photo.name) != 'default-user-profile-photo.jpg':
                        current.profile_photo.delete(save=False)
            except User.DoesNotExist:
                pass

        # Save the user
        super(User, self).save(force_insert, force_update, using, update_fields)