#from django.core.management import call_command
#import logging
##import os
#from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
##from django_cron import CronJobBase, Schedule
#from django.views.decorators.csrf import csrf_exempt
#from django.http import HttpResponse
#
#logger = logging.getLogger(__name__)
#
#@csrf_exempt
#def flush_expired_tokens(request):
#    logger.info("Flushing expired tokens")
#    call_command('flushexpiredtokens', verbosity=1)
#    return HttpResponse("Expired tokens flushed.")  # Retournez une réponse
#
#
#@csrf_exempt
#def show_blacklisted_tokens(request):
#    blacklisted_tokens = BlacklistedToken.objects.all()
#    logger.debug("Blacklisted tokens:")
#    for token in blacklisted_tokens:
#        logger.info(f"Token ID (jti): {token.token.jti}, User: {token.token.user}")
#    return HttpResponse("Blacklisted tokens shown.")  # Retournez une réponse



#class FlushExpiredTokensCronJob(CronJobBase):
#    RUN_EVERY_MINS = 1  # toutes les minutes
#
#    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
#    code = 'pong_app.flush_expired_tokens_cron_job'
#
#    def do(self):
#        flush_expired_tokens()