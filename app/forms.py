from django import forms
from .models import Observation

class ObservationForm(forms.ModelForm):
    class Meta:
        model = Observation
        fields = ['date', 'place_text', 'latitude', 'longitude', 'photo']
        widgets = {
            'date' : forms.DateInput(attrs={'type':'date'}),
            'latitude' : forms.NumberInput(attrs={'step':'0.000001'}),
            'longitude' : forms.NumberInput(attrs={'step':'0.000001'})

        }
