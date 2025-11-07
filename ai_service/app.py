from flask import Flask, request, jsonify
from flask_cors import CORS
import torch, torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from io import BytesIO
import json, os

# Configuración
APP_VERSION = os.getenv("MODEL_VERSION", "resnet18_v1_2025-10-31")
MODEL_PATH = os.getenv("MODEL_PATH", "models/weights.pth")
MAPPING_FILE = os.getenv("MAPPING_FILE", "models/class_mapping.json")
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
    global _model, _idx_to_class
    if _model is not None:
        return
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        class_to_idx = json.load(f)
    _idx_to_class = {v: k for k, v in class_to_idx.items()}
    _model = build_model(len(class_to_idx))
    state = torch.load(MODEL_PATH, map_location=_device)
    _model.load_state_dict(state)
    _model.to(_device)
    _model.eval()


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
    return {"ok": True, "version": APP_VERSION}


@app.post("/predict")
@torch.inference_mode()
def predict():
    load_model()
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
