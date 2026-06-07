import os
import requests
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

# Configurable Ollama API URL
# Default to WSL host IP (172.29.112.1) or localhost if not defined
OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', 'http://172.29.112.1:11434')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Prevent directory traversal attacks by validating path
    # Flask's send_from_directory handles security checks automatically
    return send_from_directory('.', path)

@app.route('/api/models', methods=['GET'])
def get_models():
    try:
        response = requests.get(f"{OLLAMA_API_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            return jsonify(response.json())
        return jsonify({"models": []}), response.status_code
    except Exception as e:
        # Avoid logging sensitive information and fail gracefully
        return jsonify({"error": "No se pudo conectar a Ollama. Asegúrate de que está activo.", "models": []}), 200

@app.route('/api/generate', methods=['POST'])
def generate():
    data = request.json
    if not data or 'prompt' not in data:
        return jsonify({"error": "El prompt es requerido"}), 400
    
    model = data.get('model', 'llama3')
    system_prompt = data.get('system', '')
    
    payload = {
        "model": model,
        "prompt": data['prompt'],
        "stream": False
    }
    if system_prompt:
        payload["system"] = system_prompt
        
    try:
        # Increased timeout to 120s to allow model loading into memory
        response = requests.post(f"{OLLAMA_API_URL}/api/generate", json=payload, timeout=120)
        if response.status_code == 200:
            return jsonify(response.json())
        return jsonify({"error": f"Ollama devolvió un código de error: {response.status_code}"}), response.status_code
    except requests.exceptions.Timeout:
        return jsonify({"error": "La petición a Ollama ha expirado. Esto suele pasar cuando el modelo se carga en memoria por primera vez. Por favor, inténtalo de nuevo en unos instantes."}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "No se pudo conectar con el servidor de Ollama. Asegúrate de que Ollama está activo en tu máquina."}), 503
    except Exception as e:
        return jsonify({"error": f"Ocurrió un error inesperado al conectar con Ollama: {str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'messages' not in data:
        return jsonify({"error": "El historial de mensajes es requerido"}), 400
    
    model = data.get('model', 'llama3')
    
    payload = {
        "model": model,
        "messages": data['messages'],
        "stream": False
    }
    
    try:
        # Increased timeout to 120s to allow model loading into memory
        response = requests.post(f"{OLLAMA_API_URL}/api/chat", json=payload, timeout=120)
        if response.status_code == 200:
            return jsonify(response.json())
        return jsonify({"error": f"Ollama devolvió un código de error: {response.status_code}"}), response.status_code
    except requests.exceptions.Timeout:
        return jsonify({"error": "La petición a Ollama ha expirado. Esto suele ocurrir cuando el modelo se está cargando en la memoria de tu tarjeta gráfica. Inténtalo de nuevo en unos segundos."}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "No se pudo establecer conexión con Ollama. Confirma que el servidor de Ollama está iniciado."}), 503
    except Exception as e:
        return jsonify({"error": f"Ocurrió un error inesperado: {str(e)}"}), 500

# Add security headers to all responses
@app.after_request
def add_security_headers(response):
    # TODO(security): Configure anti-clickjacking and nosniff headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    # Allow local connections for frontend API interaction, keeping it scoped
    response.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:5000'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == '__main__':
    # TODO(security): The server must listen on localhost (127.0.0.1) for testing, not 0.0.0.0
    print(f"Iniciando proxy para Ollama en {OLLAMA_API_URL}")
    app.run(host='127.0.0.1', port=5000, debug=True)
