from flask import Flask, render_template, request, jsonify
import json
from pathlib import Path

app = Flask(__name__, template_folder="templated")
ARCHIVO = Path(__file__).resolve().parent / "ranking.json"


def leer():
    if ARCHIVO.exists():
        with open(ARCHIVO, encoding="utf-8") as f:
            return json.load(f)
    return []


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/ranking")
def ver_ranking():
    return jsonify(leer()[:5])


@app.route("/ranking", methods=["POST"])
def guardar_ranking():
    d = request.get_json(silent=True)
    if not isinstance(d, dict):
        return jsonify({"error": "Se requiere un objeto JSON."}), 400

    puntos = d.get("puntos", 0)
    if isinstance(puntos, bool) or not isinstance(puntos, int) or puntos < 0:
        return jsonify({"error": "Los puntos deben ser un número entero no negativo."}), 400

    lista = leer()
    lista.append({"nombre": str(d.get("nombre", "???"))[:12],
                  "puntos": puntos})
    lista.sort(key=lambda x: x["puntos"], reverse=True)
    with open(ARCHIVO, "w", encoding="utf-8") as f:
        json.dump(lista[:20], f, ensure_ascii=False)
    return jsonify(lista[:5])


if __name__ == "__main__":
    app.run(debug=True)