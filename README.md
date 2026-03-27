# 🪲 BeetleApp — AI-Powered Beetle Species Identification

> A research platform developed in collaboration with **Universidad de Buenos Aires (FCEN · UBA)** and **Universidad Nacional del Altiplano (Peru)** to bring deep learning-powered biodiversity identification to researchers, educators, and citizen scientists.

🌐 **[Live Demo →](https://your-vercel-url.vercel.app)** *(frontend only — backend temporarily offline)*

---

## Research Background

Aquatic beetles of the *Dytiscinae* subfamily are key bioindicators of freshwater ecosystem health across Latin America — yet their identification traditionally requires specialized entomological expertise.

BeetleApp was developed as part of a formal research thesis at **Universidad Nacional de Salta**, supervised by researchers from **FCEN · UBA** and **UNA Altiplano (Peru)**, to solve this problem at scale: make expert-level species identification accessible to anyone with a smartphone.

**Supervising researchers:**
- 🇦🇷 **Dr. Cristian Martínez** — Director, Universidad Nacional de Salta
- 🇦🇷 **Dra. Patricia Torres** — Co-Director, DBBE · Facultad de Ciencias Exactas y Naturales · **Universidad de Buenos Aires**

The platform integrates **4 deep learning models** trained by UBA and UNA Altiplano researchers on morphological variants of *Coleoptera*, making them accessible through an intuitive web and mobile interface — no entomological background required.

---

## Scientific Impact

### The problem
Species identification in the field requires years of training. Researchers studying biodiversity patterns across Latin America face a bottleneck: collecting specimens is feasible at scale, but identifying them is not.

### The solution
BeetleApp democratizes access to expert-trained AI models. A field researcher, student, or citizen scientist can photograph a beetle and receive an instant species classification with confidence score — the same result that would otherwise require consulting a specialist.

### The feedback loop
Every interaction improves the research:

```
User uploads photo
        ↓
AI classifies species (confidence score)
        ↓
User validates: correct / incorrect
        ↓
Image + label stored in collaborative dataset
        ↓
Dataset feeds future model retraining
        ↓
Better models → better science
```

This turns every app user into a contributor to ongoing Latin American biodiversity research.

### Use cases
- 🔬 **Scientific research** — distribution pattern analysis across regions
- 🎓 **University education** — taxonomy courses, field biology, citizen science projects
- 🏫 **Schools & museums** — interactive educational tool for environmental education
- 🌍 **Citizen science** — broader public participation in biodiversity monitoring

---

## Features

| Feature | Description |
|---|---|
| 📸 Instant classification | Upload or capture a photo → species + confidence score |
| 🖼️ Comparative gallery | Side-by-side: submitted image vs. reference specimens |
| ✅ Collaborative validation | Users mark predictions correct/incorrect → feeds retraining dataset |
| 📚 Educational mode | Species info: habitat, biological relevance, geographic range |
| 📊 Observation history | Logged users track and review past identifications |
| 📤 Research exports | PDF/CSV reports for data analysis |
| 🔄 Model versioning | Infrastructure ready for new DL model releases |

---

## Architecture

BeetleApp uses a **decoupled microservices architecture** — the ML inference service is fully independent from the business logic API, enabling model updates without downtime and independent scaling of the AI component.

```
┌──────────────────────────────────────────────────┐
│                    Clients                       │
│     React Web (Vercel)  │  React Native (Expo)   │
└──────────────┬─────────────────────┬─────────────┘
               │                     │
               ▼                     ▼
┌─────────────────────────────────────────────────┐
│          Django REST API  (Business Logic)      │
│  Auth · History · Reports · Stats · Routing     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│       Flask ML Inference Microservice           │
│  Preprocessing → PyTorch → species + score     │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                │
│  Users · Observations · Predictions · Labels   │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML Inference | PyTorch · Flask |
| Backend API | Django · Django REST Framework |
| Frontend Web | React · TypeScript · TailwindCSS |
| Mobile | React Native · Expo |
| Database | PostgreSQL |
| Infrastructure | Docker · Docker Compose |
| Auth | JWT |
| Deployment | Vercel (frontend) |

---

## Screenshots

> *Add screenshots here*

---

## Run Locally

```bash
git clone https://github.com/Sluur/beetleapp.git
cd beetleapp
docker-compose up --build
```

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| Django API | http://localhost:8000 |
| Flask ML service | http://localhost:5000 |

---

## Project Status

| Component | Status |
|---|---|
| Django REST API | ✅ Complete |
| Flask ML microservice | ✅ Complete |
| React web frontend | ✅ Complete · [deployed on Vercel](https://your-url.vercel.app) |
| React Native mobile | ✅ Complete |
| Docker setup | ✅ Complete |
| Backend hosting | ⏸️ Temporarily offline |

---

## Academic Context

This project is the official thesis (*Seminario Técnico Profesional*) for the **Tecnicatura Universitaria en Programación** at Universidad Nacional de Salta — formally approved and supervised by researchers from UBA's Faculty of Exact and Natural Sciences.

**Developer:** Rodrigo Haro  
📍 Salta, Argentina · 🔗 [LinkedIn](https://linkedin.com/in/rodrigoleonelharo) · 📧 rodrigo.l.haro@gmail.com
