from django import forms
from .models import Observation
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import os

class ObservationForm(forms.ModelForm):
    class Meta:
        model = Observation
        fields = ['date', 'place_text', 'latitude', 'longitude', 'photo']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'latitude': forms.NumberInput(attrs={'step': '0.000001'}),
            'longitude': forms.NumberInput(attrs={'step': '0.000001'}),
        }

    def clean_photo(self):
        f = self.cleaned_data.get('photo')
        if not f:
            return f

        img = Image.open(f)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        elif img.mode == "L":
            img = img.convert("RGB")

        buf = BytesIO()
        img.save(buf, format="JPEG", quality=90)
        buf.seek(0)

        base, _ext = os.path.splitext(f.name or "image")
        new_name = base + ".jpg"

        return InMemoryUploadedFile(
            buf,
            field_name="photo",     
            name=new_name,
            content_type="image/jpeg",
            size=buf.getbuffer().nbytes,
            charset=None,
        )
