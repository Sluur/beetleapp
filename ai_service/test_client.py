import requests, sys, os

URL = "http://localhost:5001/predict"

if len(sys.argv) < 2:
    print("Uso: python test_client.py <ruta_imagen>")
    sys.exit(1)

img_path = sys.argv[1]
if not os.path.exists(img_path):
    print("No existe:", img_path)
    sys.exit(1)

with open(img_path, "rb") as f:
    files = {"image": (os.path.basename(img_path), f, "image/jpeg")}
    r = requests.post(URL, files=files, timeout=30)

print(r.status_code, r.text)
