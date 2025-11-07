from django.db import models
from django.conf import settings


class Observation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    place_text = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='observations/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} @ ({self.latitude}, {self.longitude}){self.date}"
    
class ModelVersion(models.Model):
    name = models.CharField(max_length=120, unique=True) 
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class Species(models.Model):
    name = models.CharField(max_length=120, unique=True)
    def __str__(self): return self.name

class Inference(models.Model):
    observation = models.OneToOneField(  
        'Observation', on_delete=models.CASCADE, related_name='inference'
    )
    predicted_label = models.CharField(max_length=120)
    confidence = models.FloatField()                         
    is_correct = models.BooleanField(null=True, blank=True) 
    species = models.ForeignKey(Species, null=True, blank=True, on_delete=models.SET_NULL)
    model_version = models.ForeignKey(ModelVersion, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.predicted_label} {self.confidence:.1f}%"
