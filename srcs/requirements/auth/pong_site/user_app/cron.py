from django.core.management import call_command
import logging

from django.views.decorators.http import require_POST
#import os
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
#from django_cron import CronJobBase, Schedule
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
def flush_expired_tokens(request):
    logger.info("Flushing expired tokens")
    call_command('flushexpiredtokens')
    return HttpResponse("Expired tokens flushed.")


@csrf_exempt
@require_POST
def show_blacklisted_tokens(request):
    blacklisted_tokens = BlacklistedToken.objects.all()
    logger.info("Blacklisted tokens:")
    for token in blacklisted_tokens:
        logger.info(f"Token ID (jti): {token.token.jti}, User: {token.token.user}")
    return HttpResponse("Blacklisted tokens shown.")