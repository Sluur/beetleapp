# app/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

from .models import Inference

@receiver(post_save, sender=Inference)
def send_inference_email(sender, instance: Inference, created: bool, **kwargs):
    """
    Cuando se crea una Inference, enviar un email al dueño de la observación.
    """
    if not created:
        return

    obs = instance.observation
    user = getattr(obs, "user", None)
    if not user or not user.email:
        return

    subject = "Nueva inferencia en tu observación — BeetleApp"
    detail_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/observations"
    msg = (
        f"Hola {user.username},\n\n"
        f"Se generó una nueva inferencia para tu observación del día {obs.date}.\n"
        f"Resultado: {instance.predicted_label} ({float(instance.confidence):.1f}%).\n\n"
        f"Podés verla en: {detail_url}\n\n"
        f"— BeetleApp" 
    )
    try:
        send_mail(
            subject,
            msg,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
    except Exception:
        pass
