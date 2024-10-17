from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


# Register the custom User model here
# This will allow us to manage users from the admin panel
# in localhost:8000/admin you will see a USERS section
admin.site.register(User, UserAdmin)
