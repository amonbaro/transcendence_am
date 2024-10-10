from django.core.exceptions import ValidationError

class CharactersValidator:
    def validate(self, password, user=None):
        if not any(char.isupper() for char in password):
            raise ValidationError(
                'The password must contain at least one uppercase letter', code='password_no_uppercase')
        if not any(char.islower() for char in password):
            raise ValidationError(
                'The password must contain at least one lowercase letter', code='password_no_lowercase')
        if not any(char.isnumeric() for char in password):
            raise ValidationError(
            'The password must contain at least one numeric letter', code='password_no_numeric')
        if not any( not char.isalnum() for char in password):
            raise ValidationError(
            'The password must contain at least special character', code='password_no_special_character')

    def get_help_text(self):
        return 'Your password must contain at least one uppercase letter, one lowercase letter, one numeric character, and one special character.'
