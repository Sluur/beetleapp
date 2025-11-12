from flask import Flask, request, jsonify
from flask_cors import CORS
import torch, torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from io import BytesIO
from pathlib import Path
import json, os

# ---- Configuración ----
APP_VERSION = os.getenv("MODEL_VERSION", "resnet18_v1_2025-10-31")

# rutas absolutas seguras
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "weights.pth"))
MAPPING_FILE = Path(os.getenv("MAPPING_FILE", BASE_DIR / "models" / "class_mapping.json"))

IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "224"))

app = Flask(__name__)
CORS(app)

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_model = None
_idx_to_class = None


# ---- Construcción y carga del modelo ----
def build_model(num_classes: int):
    m = models.resnet18(weights=None)
    m.fc = nn.Linear(m.fc.in_features, num_classes)
    return m


def load_model():
    """Carga el modelo y el mapeo de clases, manejando errores sin romper el servidor."""
    global _model, _idx_to_class

    if _model is not None:
        return

    try:
        if not MAPPING_FILE.exists():
            raise FileNotFoundError(f"No se encontró {MAPPING_FILE}")
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"No se encontró {MODEL_PATH}")

        with open(MAPPING_FILE, "r", encoding="utf-8") as f:
            class_to_idx = json.load(f)

        _idx_to_class = {v: k for k, v in class_to_idx.items()}
        _model = build_model(len(class_to_idx))
        state = torch.load(MODEL_PATH, map_location=_device)
        _model.load_state_dict(state)
        _model.to(_device)
        _model.eval()

        print(f"[OK] Modelo cargado correctamente: {len(class_to_idx)} clases.")

    except Exception as e:
        print(f"[WARN] No se pudo cargar el modelo: {e}")
        _model = None
        _idx_to_class = None


# ---- Transformación de imagen ----
_tf = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])


# ---- Endpoints ----
@app.get("/health")
def health():
    ok = _model is not None
    return {"ok": ok, "version": APP_VERSION}


@app.post("/predict")
@torch.inference_mode()
def predict():
    load_model()

    if _model is None or _idx_to_class is None:
        return jsonify({"detail": "model not loaded"}), 500

    if "image" not in request.files:
        return jsonify({"detail": "send multipart/form-data with 'image'"}), 400

    img = Image.open(BytesIO(request.files["image"].read())).convert("RGB")
    x = _tf(img).unsqueeze(0).to(_device)
    probs = torch.softmax(_model(x), dim=1)
    conf, cls = probs.max(dim=1)
    label = _idx_to_class[int(cls.item())]

    return jsonify({
        "label": label,
        "confidence": float(conf.item() * 100.0),
        "version": APP_VERSION
    })


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=5001)
