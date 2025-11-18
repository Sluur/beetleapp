from io import BytesIO

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import EmailMessage
from django.conf import settings

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader

from .models import Inference


@receiver(post_save, sender=Inference)
def send_inference_email(sender, instance: Inference, created: bool, **kwargs):
    if not created:
        return

    obs = instance.observation
    user = getattr(obs, "user", None)
    if not user or not user.email:
        return

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Nueva inferencia — BeetleApp")
    y -= 30

    p.setFont("Helvetica", 10)
    p.drawString(50, y, f"Usuario: {user.username}")
    y -= 15
    p.drawString(50, y, f"Fecha observación: {obs.date.isoformat()}")
    y -= 15
    p.drawString(50, y, f"Lugar: {obs.place_text or '-'}")
    y -= 15
    p.drawString(50, y, f"Coordenadas: ({obs.latitude}, {obs.longitude})")
    y -= 25

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Inferencia generada por IA")
    y -= 18

    p.setFont("Helvetica", 10)
    p.drawString(60, y, f"Especie: {instance.predicted_label}")
    y -= 15
    p.drawString(60, y, f"Confianza: {float(instance.confidence):.1f}%")
    y -= 15
    if instance.model_version:
        p.drawString(60, y, f"Modelo usado: {instance.model_version.name}")
        y -= 15

    y -= 20

    if obs.photo:
        try:
            image_path = obs.photo.path
            img = ImageReader(image_path)
            img_width, img_height = img.getSize()

            max_width = width - 100
            max_height = 250

            scale = min(max_width / img_width, max_height / img_height, 1.0)
            draw_w = img_width * scale
            draw_h = img_height * scale

            if y - draw_h < 50:
                p.showPage()
                y = height - 50

            x = 50
            img_y = y - draw_h

            p.drawImage(
                img,
                x,
                img_y,
                width=draw_w,
                height=draw_h,
                preserveAspectRatio=True,
                anchor="sw",
            )

            y = img_y - 20
        except Exception:
            pass

    p.showPage()
    p.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()

    subject = "Nueva inferencia en tu observación — BeetleApp"
    detail_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/observations"
    body = (
        f"Hola {user.username},\n\n"
        f"Se generó una nueva inferencia para tu observación del día {obs.date}.\n"
        f"Podés verla en la web:\n{detail_url}\n\n"
        f"En el archivo PDF adjunto vas a encontrar el detalle junto con la foto.\n\n"
        f"— BeetleApp"
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or getattr(
        settings, "EMAIL_HOST_USER", None
    )
    if not from_email:
        return

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=from_email,
        to=[user.email],
    )
    email.attach("inferencia.pdf", pdf_bytes, "application/pdf")
    email.send(fail_silently=True)
