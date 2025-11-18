# app/signals.py
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
    """
    Cuando se crea una Inference, enviar un email al dueño de la observación
    con un PDF adjunto que incluye datos + foto de la observación.
    """
    if not created:
        return

    obs = instance.observation
    user = getattr(obs, "user", None)
    if not user or not user.email:
        return

    # =======================
    # 1) Generar PDF en memoria
    # =======================
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 50

    # Título
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Nueva inferencia — BeetleApp")
    y -= 30

    # Datos básicos
    p.setFont("Helvetica", 10)
    p.drawString(50, y, f"Usuario: {user.username}")
    y -= 15
    p.drawString(50, y, f"Fecha observación: {obs.date.isoformat()}")
    y -= 15
    p.drawString(50, y, f"Lugar: {obs.place_text or '-'}")
    y -= 15
    p.drawString(50, y, f"Coordenadas: ({obs.latitude}, {obs.longitude})")
    y -= 25

    # Inferencia
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

    # =======================
    # 2) Insertar la foto (si existe)
    # =======================
    if obs.photo:
        try:
            # Leemos la imagen desde el path del ImageField
            image_path = obs.photo.path
            img = ImageReader(image_path)
            img_width, img_height = img.getSize()

            # Definimos un área máxima para la foto
            max_width = width - 100  # márgenes izquierda/derecha
            max_height = 250         # alto máximo para la foto

            # Calculamos escala manteniendo proporción
            scale = min(max_width / img_width, max_height / img_height, 1.0)
            draw_w = img_width * scale
            draw_h = img_height * scale

            # Si no hay lugar suficiente en la página actual, saltamos de página
            if y - draw_h < 50:
                p.showPage()
                y = height - 50

            # Posición de la imagen (anclada abajo a la izquierda)
            x = 50
            # y de la esquina inferior de la imagen
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

            y = img_y - 20  # dejamos un poco de espacio debajo
        except Exception:
            # Si hay cualquier problema con la imagen, seguimos sin romper el envío
            pass

    # Cerramos PDF
    p.showPage()
    p.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()

    # =======================
    # 3) Enviar mail con PDF adjunto
    # =======================
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
