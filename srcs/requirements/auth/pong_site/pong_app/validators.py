from django.core.exceptions import ValidationError

def validate_password_match(new_password, new_password2):
    if new_password != new_password2:
        raise ValidationError("The two passwords don't match.")
    return new_password

def file_size_validator(image):
    if image.size > 2 * 1024 * 1024:
        raise ValidationError("The file is too large. It must be less than 2MB.")
    return

