from flask import Flask, request, jsonify
import joblib
import os
import numpy as np

app = Flask(__name__)

@app.route("/api/predict_generation_rate", methods=["POST"])
def predict_generation_rate():
    data = request.get_json()

    height = data.get("height")
    width = data.get("width")
    boxes = data.get("boxes")
    minWalls = data.get("minWalls")

    # Validate width and height
    if not (5 <= width <= 12 and 5 <= height <= 12):
        return jsonify({"error": "Width and Height must be between 5 and 12"}), 400

    # Validate boxes
    if boxes not in [2, 3, 4]:
        return jsonify({"error": "Boxes must be 2, 3, or 4"}), 400

    # Validate minWalls
    if not (5 <= minWalls <= 12):
        return jsonify({"error": "minWalls must be between 5 and 12"}), 400

    try:
        # Load model
        model_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '../../prediction/level_prediction_model.joblib')
        )
        loaded_model = joblib.load(model_path)

        # Load scaler
        scaler_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), '../../prediction/scaler.joblib')
        )
        scaler = joblib.load(scaler_path)

        # Prepare input
        new_input = np.array([[height, width, boxes, minWalls]])
        new_input_scaled = scaler.transform(new_input)

        # Predict
        prediction = loaded_model.predict(new_input_scaled)

        response = {
            "message": "Prediction successful",
            "height": height,
            "width": width,
            "boxes": boxes,
            "minWalls": minWalls,
            "level_generation_time": round(float(prediction[0][0]), 3),
            "level_success_chance": round(float(prediction[0][1]), 3) * 100,
            "level_attempts": round(float(prediction[0][2]), 3)
        } 
        return jsonify(response),200

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500