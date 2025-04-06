import sys
import json
import cv2
import numpy as np
from fer import FER  # pip install fer

# Load image from base64
image_data = sys.argv[1].split(",")[1]
nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# Detect emotion
detector = FER()
result = detector.detect_emotions(img)
emotion = max(result[0]["emotions"].items(), key=lambda x: x[1])[0] if result else "neutral"

print(json.dumps({"emotion": emotion}))