from django.db import models
from django.conf import settings

# Create your models here.

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