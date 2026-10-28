from flask import Flask, render_template, request, jsonify
import json, os

app = Flask(__name__, template_folder="templated")
ARCHIVO = "ranking.json"


def leer():
    if os.path.exists(ARCHIVO):
        with open(ARCHIVO) as f:
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
    if isinstance(puntos, bool):
        return jsonify({"error": "Los puntos deben ser un número entero no negativo."}), 400
    try:
        puntos = int(puntos)
    except (TypeError, ValueError):
        return jsonify({"error": "Los puntos deben ser un número entero no negativo."}), 400
    if puntos < 0:
        return jsonify({"error": "Los puntos deben ser un número entero no negativo."}), 400

    lista = leer()
    lista.append({"nombre": str(d.get("nombre", "???"))[:12],
                  "puntos": puntos})
    lista.sort(key=lambda x: x["puntos"], reverse=True)
    with open(ARCHIVO, "w") as f:
        json.dump(lista[:20], f)
    return jsonify(lista[:5])


if __name__ == "__main__":
    app.run(debug=True)