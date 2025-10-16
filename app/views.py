from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login as auth_login
from .forms import ObservationForm
from .models import Observation

# Create your views here.

def home(request):
        return render(request, 'app/home.html')

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            return redirect('home')
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

@login_required
def observation_create(request):
        if request.method == 'POST':
            form = ObservationForm(request.POST, request.FILES)
            if form.is_valid():
                 obs = form.save(commit=False)
                 obs.user = request.user
                 obs.save()
                 return redirect('observation_list')
        else:
            form = ObservationForm()
        return render(request, 'app/observation_form.html',{'form':form})

@login_required
def observation_list(request):
     qs = Observation.objects.filter(user=request.user).order_by('-created_at')
     return render(request,'app/observation_list.html', {'observations': qs})
