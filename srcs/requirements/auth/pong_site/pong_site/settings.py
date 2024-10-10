"""
Django settings for pong_site project.

Generated by 'django-admin startproject' using Django 5.0.7.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

import os
import logging # for custom logs messages
from pathlib import Path
from datetime import timedelta # for jwt
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

# ----------------------------------------------------------------------------------------------------------------------

# LOGLVL environment variable is set in .env file to change the log level
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# Function to get the value of a secret from a file
# If the docker secret file is not found, raise an error and stop the porject
def get_docker_secret(key):
    value = os.getenv(key)  # On ne fournit pas de valeur par défaut
    if value and os.path.isfile(value):
        with open(value) as f:
            secret = f.read().strip()
           # logger.debug(f"Secret file for {key} was successfully read.")
            return secret
    else:
        #logging.critical(f"Secret file {value} not found or {key} not set.")
        raise ImproperlyConfigured(f"Secret file {value} not found or {key} not set.")

# ----------------------------------------------------------------------------------------------------------------------
import os

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} {levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {  # Ajout d'un handler de fichier
            'level': LOG_LEVEL,
            'class': 'logging.FileHandler',
            'filename': '/logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],  # Ajout du handler de fichier
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'pong_app': {
            'handlers': ['console', 'file'],  # Ajout du handler de fichier
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}
# ----------------------------------------------------------------------------------------------------------------------

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# ----------------------------------------------------------------------------------------------------------------------
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_docker_secret("AUTH_SECRET_KEY_FILE")
#SECRET_KEY = os.getenv("SECRET_KEY", "ibtsbkme9qzobigklv7eytb5c9l8tpdhjjk")
#logger.debug(f"SECRET_KEY: {SECRET_KEY}")

# ----------------------------------------------------------------------------------------------------------------------
# SECURITY WARNING: don't run with debug turned on in production!
#DEBUG = os.getenv("DEBUG")
if os.getenv("DEBUG") == "True":
    DEBUG = True
else:
    DEBUG = False
#logger.debug(f'Debug mode is {DEBUG}')

# ----------------------------------------------------------------------------------------------------------------------
ALLOWED_HOSTS = [
    os.getenv("DOMAIN_NAME", "localhost"),
    '127.0.0.1',
    'localhost',
]
# ----------------------------------------------------------------------------------------------------------------------
# Application definition
INSTALLED_APPS = [
    'pong_app.apps.PongAppConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
#    'django_cron',
]

#CRON_CLASSES = [
#    'pong_app.cron.FlushExpiredTokensCronJob',
#]
# ----------------------------------------------------------------------------------------------------------------------
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

#CRONJOBS = [
#    (
#        '*/1 * * * *', 'pong_app.cron.flush_expired_tokens', '>> /usr/src/app/cron_job.log 2>&1',
#        {
#            'POSTGRES_DB_NAME_FILE': '/run/secrets/postgres_db_name',
#            'POSTGRES_USER_FILE': '/run/secrets/postgres_user',
#            'POSTGRES_PASSWORD_FILE': '/run/secrets/postgres_password',
#        }
#    )
#]
#
# ----------------------------------------------------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication', # stateless authetication
        'rest_framework_simplejwt.authentication.JWTStatelessUserAuthentication', # for microservices
    ),
}
# ----------------------------------------------------------------------------------------------------------------------
AUTHENTICATION_BACKENDS = [
    #'pong_app.authentication.MyCustomModelBackend',
    'django.contrib.auth.backends.AllowAllUsersModelBackend',  # Permet à tous les utilisateurs de s'authentifier, même inactifs
    'django.contrib.auth.backends.ModelBackend', # Backend par défaut
]

# ----------------------------------------------------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    "ALGORITHM": "HS256",
    "SIGNING_KEY": settings.SECRET_KEY,
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
  #  'USER_AUTHENTICATION_RULE': "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    'USER_AUTHENTICATION_RULE': "pong_app.authentication.custom_user_authentication_rule", # custom behaviour: inactif account's can login

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "pong_app.models",

    "JTI_CLAIM": "jti",

    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=60),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),

#    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_OBTAIN_SERIALIZER": "pong_app.serializers.MyCustomTokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
    "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
    "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
}


# ----------------------------------------------------------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ----------------------------------------------------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    'https://pong.42lausanne.ch',
    'https://localhost',
    'https://127.0.0.1',
]

CORS_ALLOW_METHODS = (
    'GET',
    'PATCH',
    'POST',
    'PUT',
)

CORS_ALLOW_HEADERS = (
    'Accept',
    'Authorization',
    'Content-Type',
    'user-agent',
)

CORS_ALLOW_CREDENTIALS = True

# ----------------------------------------------------------------------------------------------------------------------
ROOT_URLCONF = 'pong_site.urls'

# ----------------------------------------------------------------------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ----------------------------------------------------------------------------------------------------------------------
WSGI_APPLICATION = 'pong_site.wsgi.application'

# ----------------------------------------------------------------------------------------------------------------------
PGNAME = get_docker_secret("POSTGRES_DB_NAME_FILE")
#logger.debug(f'PGNAME: {PGNAME}')

PGUSER = get_docker_secret("POSTGRES_USER_FILE")
#logger.debug(f'PGUSER: {PGUSER}')

PGPASS = get_docker_secret("POSTGRES_PASSWORD_FILE")
#logger.debug(f'PGPASS: {PGPASS}')


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': PGNAME,
        'USER': PGUSER,
        'PASSWORD': PGPASS,
        'HOST': 'postgres',  # same name as the postgres service name in the docker-compose file
        'PORT': 5432,
    }
}

# ----------------------------------------------------------------------------------------------------------------------
# Default Password Hasher values
# Cela signifie que Django utilisera PBKDF2 pour stocker tous les mots de passe,
# mais qu’il acceptera de vérifier des mots de passe stockés avec les
# algorithmes PBKDF2SHA1, argon2 et bcrypt.
# https://docs.djangoproject.com/en/5.0/topics/auth/passwords/
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

# ----------------------------------------------------------------------------------------------------------------------
# Password validation
# UserAttributeSimilarityValidator, qui vérifie la similitude entre le mot de passe et certains attributs de l’utilisateur.
# MinimumLengthValidator, qui vérifie la longueur minimale du mot de passe. Ce validateur est configuré avec une option personnalisée : il exige une longueur minimale de 9 caractères, au lieu des 8 par défaut.
# CommonPasswordValidator, qui vérifie si le mot de passe se trouve dans une liste de mots de passe courants. Par défaut, cette comparaison se fait avec une liste de 20’000 mots de passe courants.
# NumericPasswordValidator, qui vérifie que le mot de passe n’est pas entièrement numérique.
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        # default max_similarity = 0.7
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,  # Minimum password length required is 12 characters
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'pong_site.validators.CharactersValidator',
    },
    {
        'NAME': 'pong_site.validators.CharactersValidator',
    },
]

# ----------------------------------------------------------------------------------------------------------------------
# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

USE_TZ = True

TIME_ZONE = 'Europe/Zurich'

USE_I18N = True




# ----------------------------------------------------------------------------------------------------------------------
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/
#pong_app/static/pong_app
STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

STATIC_ROOT = BASE_DIR / "staticfiles"
#STATIC_ROOT = None

STORAGES = {
    # ...
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ----------------------------------------------------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ----------------------------------------------------------------------------------------------------------------------
# use the Custom User model instead of the default User model
AUTH_USER_MODEL = 'pong_app.User'


# ----------------------------------------------------------------------------------------------------------------------
# for media serving: images
MEDIA_URL = 'https://localhost/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
        'OPTIONS': {
            'location': MEDIA_ROOT,
        },
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

# ----------------------------------------------------------------------------------------------------------------------
DATETIME_FORMAT = '%d %b %Y %H:%M:%S'

#-----------------------------------------------------------------------------------------------------------------------
# SSL/ HTTPS
# source: https://docs.djangoproject.com/fr/5.1/topics/security/#ssl-https
#-----------------------------------------------------------------------------------------------------------------------
# source: https://docs.djangoproject.com/fr/5.1/ref/settings/#std-setting-SECURE_PROXY_SSL_HEADER
# It demands three requirements to be set in the nginx configuration file
#-----------------------------------------------------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

#-----------------------------------------------------------------------------------------------------------------------
# source: https://docs.djangoproject.com/fr/5.1/ref/settings/#std-setting-SECURE_SSL_REDIRECT
# Default is False. If set to True, all non-HTTPS requests are redirected to HTTPS
#-----------------------------------------------------------------------------------------------------------------------
SECURE_SSL_REDIRECT = True

#-----------------------------------------------------------------------------------------------------------------------
# If a browser connects initially via HTTP, which is the default for most browsers, it is possible for existing cookies
# to be leaked. For this reason, you should set your SESSION_COOKIE_SECURE and CSRF_COOKIE_SECURE settings to True.
# This instructs the browser to only send these cookies over HTTPS connections. Note that this will mean that sessions
# will not work over HTTP, and the CSRF protection will prevent any POST data being accepted over HTTP
# (which will be fine if you are redirecting all HTTP traffic to HTTPS).
#-----------------------------------------------------------------------------------------------------------------------
SESSION_COOKIE_SECURE = True # cookie is only sent under an HTTPS connection.
CSRF_COOKIE_SECURE = True # secure cookie for the CSRF cookie: browsers may ensure that the cookie is only sent with an HTTPS connection.

#-----------------------------------------------------------------------------------------------------------------------
#  HTTP Strict Transport Security (HSTS)
# HSTS is an HTTP header that informs a browser that all future connections to a particular site should always use HTTPS.
# Combined with redirecting requests over HTTP to HTTPS, this will ensure that connections always enjoy the added security
# of SSL provided one successful connection has occurred.
#-----------------------------------------------------------------------------------------------------------------------

X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 63072000  # Active HSTS (HTTP Strict Transport Security) for 2 years
SECURE_HSTS_INCLUDE_SUBDOMAINS = False  # Applique HSTS aux sous-domaines
SECURE_HSTS_PRELOAD = False  # Autorise le préchargement HSTS dans les navigateurs
SECURE_CONTENT_TYPE_NOSNIFF = True