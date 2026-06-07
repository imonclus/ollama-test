# Espacios Creativos con Ollama

Una aplicación web de página única (SPA) diseñada para potenciar la escritura creativa, la generación de historias y la creación de mundos utilizando modelos de lenguaje locales impulsados de forma privada y segura por **Ollama**.

## 🎨 Módulos Creativos

La aplicación se divide en cuatro herramientas principales:

- **Aventura (Rol de Texto):** Vive historias interactivas en escenarios predefinidos (Cyberpunk, Fantasía, Espacio) o crea tu propio punto de partida. El modelo actúa como tu director de juego.
- **Musa (Asistente Literario):** Un lienzo de escritura donde la inteligencia artificial te ayuda a continuar tus textos, sugerir giros argumentales imprevistos o reescribir fragmentos con un tono distinto (poético, oscuro, irónico, etc.).
- **Forjador de Mundos:** Herramienta para generar "lore" estructurado. Crea fichas evocadoras y detalladas de personajes, artefactos, lugares o facciones adaptadas al género literario que elijas.
- **Oráculo:** Conversa con diversas personalidades integradas (Alquimista Hermético, Cyborg Existencialista, Oráculo de Delfos, Filósofo Cínico) para obtener perspectivas únicas o inspiración.

## ⚙️ Requisitos

- [Python 3.7+](https://www.python.org/downloads/)
- [Ollama](https://ollama.ai/) instalado y ejecutándose en tu equipo.
- Al menos un modelo de lenguaje descargado en Ollama (ej. `llama3`, `mistral`, etc.).

## 🚀 Instalación y Uso

1. Clona o descarga los archivos de este proyecto.
2. Crea y activa un entorno virtual (recomendado) y luego instala las dependencias de Python:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install flask requests
   ```
3. Asegúrate de tener Ollama iniciado. Puedes descargar un modelo inicial ejecutando:
   ```bash
   ollama pull llama3
   ```
4. (Opcional) La aplicación busca la API de Ollama por defecto en la IP de host de WSL (`http://172.29.112.1:11434`). Si tu Ollama corre directamente en localhost, puedes ajustar esto mediante una variable de entorno:
   ```bash
   export OLLAMA_API_URL="http://127.0.0.1:11434"
   ```
5. Inicia el servidor proxy de Flask (asegúrate de tener el entorno virtual activado):
   ```bash
   python3 app.py
   ```
6. Abre tu navegador web y visita: http://127.0.0.1:5000

## 🏗️ Arquitectura

- **Frontend:** Vanilla JavaScript interactuando directamente con el DOM y renderizando Markdown de forma segura. El estado local y las historias se persisten en el `localStorage` del navegador.
- **Backend:** Un servidor de Flask ligero (`app.py`) encargado de servir los archivos estáticos y actuar como un proxy seguro hacia la API de Ollama, evitando problemas de CORS y controlando las excepciones y tiempos de espera.

## 🛡️ Seguridad

Se incluyen cabeceras de seguridad estrictas desde el servidor y se ha evitado el uso de `innerHTML` en el frontend, construyendo los nodos del DOM programáticamente para prevenir vulnerabilidades XSS.

## 📄 Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.