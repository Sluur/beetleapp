FROM python:3.11-slim

# Evita bytecode y buffer raro
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias del sistema mínimas
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copiamos requirements primero (mejor cache)
COPY requirements.txt .

# Instalamos SOLO CPU
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código
COPY . .

# Render usa PORT
EXPOSE 8000

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8000", "app:app"]
