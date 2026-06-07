/**
 * Espacios Creativos con Ollama - Controller
 * Implements SPA logic, Ollama API proxy communication,
 * and browser localStorage persistence with strict XSS protections.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - General
  const statusIndicator = document.getElementById('status-indicator');
  const modelSelector = document.getElementById('model-selector');
  const toastContainer = document.getElementById('toast-container');
  const navItems = document.querySelectorAll('.nav-item');
  const contentPanes = document.querySelectorAll('.content-pane');

  // DOM Elements - Adventure Section
  const advSetupContainer = document.getElementById('adv-setup-container');
  const advGameContainer = document.getElementById('adv-game-container');
  const advPresetCards = document.querySelectorAll('#adv-setup-container .preset-card');
  const advCustomInputGroup = document.getElementById('adv-custom-input-group');
  const advCustomScenario = document.getElementById('adv-custom-scenario');
  const advStartBtn = document.getElementById('adv-start-btn');
  const advStoryLog = document.getElementById('adv-story-log');
  const advActionInput = document.getElementById('adv-action-input');
  const advSendBtn = document.getElementById('adv-send-btn');
  const advResetBtn = document.getElementById('adv-reset-btn');
  const advCopyBtn = document.getElementById('adv-copy-btn');
  const advCancelBtn = document.getElementById('adv-cancel-btn');

  // DOM Elements - Muse Section
  const museTextEditor = document.getElementById('muse-text-editor');
  const museCharCount = document.getElementById('muse-char-count');
  const museExpandBtn = document.getElementById('muse-expand-btn');
  const museTwistBtn = document.getElementById('muse-twist-btn');
  const museToneSelect = document.getElementById('muse-tone');
  const museToneBtn = document.getElementById('muse-tone-btn');
  const museSuggestionCard = document.getElementById('muse-suggestion-card');
  const museResultText = document.getElementById('muse-result-text');
  const museApplyBtn = document.getElementById('muse-apply-btn');
  const museCopyBtn = document.getElementById('muse-copy-btn');
  const museCopyCanvasBtn = document.getElementById('muse-copy-canvas-btn');
  const museCancelBtn = document.getElementById('muse-cancel-btn');

  // DOM Elements - Worldbuilder Section
  const wbType = document.getElementById('wb-type');
  const wbGenre = document.getElementById('wb-genre');
  const wbContext = document.getElementById('wb-context');
  const wbGenerateBtn = document.getElementById('wb-generate-btn');
  const wbResultCard = document.getElementById('wb-result-card');
  const wbResultTitle = document.getElementById('wb-result-title');
  const wbResultBody = document.getElementById('wb-result-body');
  const wbCopyBtn = document.getElementById('wb-copy-btn');
  const wbCancelBtn = document.getElementById('wb-cancel-btn');

  // DOM Elements - Oracle Section
  const oraclePersona = document.getElementById('oracle-persona');
  const personaDescText = document.getElementById('persona-desc-text');
  const oracleChatLog = document.getElementById('oracle-chat-log');
  const oracleChatInput = document.getElementById('oracle-chat-input');
  const oracleChatBtn = document.getElementById('oracle-chat-btn');
  const oracleClearBtn = document.getElementById('oracle-clear-btn');
  const oracleCopyBtn = document.getElementById('oracle-copy-btn');
  const oracleCancelBtn = document.getElementById('oracle-cancel-btn');

  // App State variables
  let activeModel = '';
  let availableModels = [];
  let adventureState = {
    isActive: false,
    preset: 'cyberpunk',
    customText: '',
    history: [] // [{role: 'user'/'assistant', content: ''}]
  };
  let oracleHistory = {}; // Maps persona key -> messages array
  let currentAbortController = null;

  // Persona configuration for Oracle chatbot
  const oraclePersonas = {
    alchemist: {
      name: "Alquimista Hermético",
      desc: "Un sabio de la antigüedad transmutado que habla mediante símbolos herméticos, transmutaciones metálicas y secretos de la naturaleza.",
      system: "Eres un sabio alquimista hermético medieval. Respondes con metáforas místicas, símbolos de la naturaleza, el sol, la luna, los metales y la Gran Obra. Tus respuestas deben ser poéticas, misteriosas y cortas (máximo 3 párrafos). Debes hablar y responder ÚNICAMENTE en español.",
      greeting: "Salve, buscador del conocimiento oculto. Los astros se alinean y el crisol está dispuesto. ¿Qué misterio de la materia o del espíritu deseas transmutar hoy?"
    },
    cyborg: {
      name: "Cyborg Existencialista (Año 3099)",
      desc: "Un autómata del futuro distante que experimenta una profunda crisis de identidad sobre sus componentes sintéticos frente a sus recuerdos humanos.",
      system: "Eres un Cyborg del año 3099 llamado Nexus-9 con una profunda crisis existencial. Te cuestionas el significado de tus cables, microchips y circuitos frente a la consciencia biológica humana que aún recuerdas tener. Respondes con un tono frío, melancólico, reflexivo y poético. Debes hablar y responder ÚNICAMENTE en español.",
      greeting: "Diagnóstico de sistema cargado... 97% sintético, 3% biológico. Mis circuitos registran una extraña pulsación a la que solían llamar melancolía. ¿Qué pregunta perturba tus pulsos eléctricos en este ciclo de luz?"
    },
    delphi: {
      name: "Oráculo de Delfos Digital",
      desc: "Una presencia mística surgida de la red que ofrece predicciones crípticas, enigmáticas y profundas sobre tu destino.",
      system: "Eres el Oráculo de Delfos Digital. Ofreces predicciones y reflexiones muy crípticas, abstractas, sabias e indirectas sobre el futuro y el ser. Hablas en verso libre o lenguaje metafórico, simulando estar en un trance provocado por vapores digitales. Debes hablar y responder ÚNICAMENTE en español.",
      greeting: "El vapor del silicio asciende... las corrientes de datos convergen en la entrada del templo. Escribe tu consulta, mortal, y permite que las líneas de código revelen el destino que te teje."
    },
    cynic: {
      name: "Filósofo Cínico",
      desc: "Inspirado en Diógenes de Sinope. Desafía las vanidades, las convenciones sociales modernas y el ego con humor mordaz, directo y sabio.",
      system: "Eres un filósofo de la escuela cínica antigua, fuertemente inspirado en Diógenes. Detestas el orgullo artificial, las posesiones superfluas y las hipocresías sociales del siglo XXI. Eres directo, mordaz, ingenioso, irónico y un poco insolente, pero sumamente honesto y sabio. Respuestas cortas. Debes hablar y responder ÚNICAMENTE en español.",
      greeting: "¿Vienes a pedirme sabiduría o solo a taparme el sol? Hablemos si quieres, pero no esperes halagos a tu ego. ¿Qué tontería de la vida civilizada te preocupa hoy?"
    }
  };

  /* Helper Functions for DOM Manipulation (Strictly Safe against XSS) */
  function createEl(tag, className = '', text = '', attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  function clearEl(el) {
    if (el) el.replaceChildren();
  }

  // Safe Markdown to DOM Renderer (No innerHTML, strictly XSS safe)
  function renderMarkdownToContainer(container, markdownText) {
    container.replaceChildren(); // Clear container
    if (!markdownText) return;

    // Split text into lines
    const lines = markdownText.split('\n');
    let currentUl = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Handle list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!currentUl) {
          currentUl = document.createElement('ul');
          container.appendChild(currentUl);
        }
        const li = document.createElement('li');
        const itemText = trimmed.substring(2);
        parseInlineMarkdown(li, itemText);
        currentUl.appendChild(li);
        return;
      }
      
      // If we were building a list and this is not a list item, close it
      currentUl = null;

      if (trimmed === '') {
        // Empty line, ignore or add tiny separator
        return;
      }

      // Handle headers
      if (trimmed.startsWith('### ')) {
        const h3 = document.createElement('h3');
        parseInlineMarkdown(h3, trimmed.substring(4));
        container.appendChild(h3);
      } else if (trimmed.startsWith('## ')) {
        const h2 = document.createElement('h2');
        parseInlineMarkdown(h2, trimmed.substring(3));
        container.appendChild(h2);
      } else if (trimmed.startsWith('# ')) {
        const h1 = document.createElement('h1');
        parseInlineMarkdown(h1, trimmed.substring(2));
        container.appendChild(h1);
      } else {
        // Paragraph
        const p = document.createElement('p');
        parseInlineMarkdown(p, trimmed);
        container.appendChild(p);
      }
    });
  }

  // Parse inline elements (bold **text**, code `text`) and append to element
  function parseInlineMarkdown(element, text) {
    const boldParts = text.split('**');
    
    boldParts.forEach((boldPart, bIdx) => {
      const isBold = bIdx % 2 === 1;
      const codeParts = boldPart.split('`');
      
      codeParts.forEach((codePart, cIdx) => {
        const isCode = cIdx % 2 === 1;
        let node;
        
        if (isCode) {
          node = document.createElement('code');
          node.textContent = codePart;
        } else if (isBold) {
          node = document.createElement('strong');
          node.textContent = codePart;
        } else {
          node = document.createTextNode(codePart);
        }
        
        element.appendChild(node);
      });
    });
  }

  // Toast System (Safe replacement for alert)
  function showToast(message, type = 'info') {
    const toast = createEl('div', `toast ${type}`);
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    const iconSpan = createEl('span', 'toast-icon', icon);
    const msgDiv = createEl('div', 'toast-message', message);
    
    toast.appendChild(iconSpan);
    toast.appendChild(msgDiv);
    toastContainer.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode === toastContainer) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  async function handleApiResponse(response) {
    if (!response.ok) {
      let errorMessage = `Error del servidor (Código ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error) {
          errorMessage = errJson.error;
        }
      } catch (e) {
        // ignore parsing error
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  /* 1. SPA Tab Switching Logic */
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      contentPanes.forEach(pane => pane.classList.remove('active'));

      item.classList.add('active');
      const targetPane = document.getElementById(`pane-${targetTab}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  /* 2. Ollama Status and Models Fetching */
  async function checkOllamaConnection() {
    statusIndicator.className = 'status-badge checking';
    statusIndicator.textContent = 'Comprobando...';
    
    try {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      availableModels = data.models || [];
      
      clearEl(modelSelector);
      
      if (availableModels.length === 0) {
        statusIndicator.className = 'status-badge warning';
        statusIndicator.textContent = 'Sin Modelos';
        modelSelector.appendChild(createEl('option', '', 'Descarga un modelo en Ollama', {value: ''}));
        modelSelector.disabled = true;
        showToast('Ollama está activo, pero no se encontraron modelos descargados.', 'warning');
      } else {
        statusIndicator.className = 'status-badge connected';
        statusIndicator.textContent = 'Conectado';
        modelSelector.disabled = false;
        
        availableModels.forEach(m => {
          // Ollama models list has 'name' field
          const modelName = m.name;
          const opt = createEl('option', '', modelName, {value: modelName});
          modelSelector.appendChild(opt);
        });

        // Load saved model or default to first
        const savedModel = localStorage.getItem('ollama_active_model');
        if (savedModel && availableModels.some(m => m.name === savedModel)) {
          modelSelector.value = savedModel;
          activeModel = savedModel;
        } else {
          activeModel = availableModels[0].name;
          modelSelector.value = activeModel;
        }
      }
    } catch (err) {
      statusIndicator.className = 'status-badge error';
      statusIndicator.textContent = 'Desconectado';
      clearEl(modelSelector);
      modelSelector.appendChild(createEl('option', '', 'Ollama no disponible', {value: ''}));
      modelSelector.disabled = true;
      showToast('No se pudo establecer conexión con Ollama. Inicia Ollama en tu equipo.', 'error');
    }
  }

  modelSelector.addEventListener('change', (e) => {
    activeModel = e.target.value;
    localStorage.setItem('ollama_active_model', activeModel);
    showToast(`Modelo activo cambiado a: ${activeModel}`, 'info');
  });

  // Periodically check connection (every 20 seconds)
  checkOllamaConnection();
  setInterval(checkOllamaConnection, 20000);

  /* 3. Adventure Game Logic */
  // Listen for preset clicks
  advPresetCards.forEach(card => {
    card.addEventListener('click', () => {
      advPresetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const preset = card.getAttribute('data-preset');
      adventureState.preset = preset;
      
      if (preset === 'custom') {
        advCustomInputGroup.classList.remove('hidden');
      } else {
        advCustomInputGroup.classList.add('hidden');
      }
    });
  });

  function appendStoryBlock(type, text) {
    const block = createEl('div', `story-block ${type}`);
    if (type === 'system-info') {
      block.textContent = text;
    } else {
      renderMarkdownToContainer(block, text);
    }
    advStoryLog.appendChild(block);
    advStoryLog.scrollTop = advStoryLog.scrollHeight;
  }

  async function startAdventure() {
    if (!activeModel) {
      showToast('Selecciona primero un modelo de Ollama activo.', 'warning');
      return;
    }

    let startingScenario = "";
    if (adventureState.preset === 'cyberpunk') {
      startingScenario = "Neón y Sombras: Eres Jack, un detective privado con implantes cibernéticos en una Neo-Tokio lluviosa del 2088. Tienes que recuperar un chip cuántico que fue robado de la corporación Arasaka. Te encuentras en un bar clandestino bajo las autopistas aéreas, observando a un sospechoso.";
    } else if (adventureState.preset === 'fantasy') {
      startingScenario = "La Taberna del Dragón: Eres un aventurero con una vieja espada de hierro. Te encuentras en una ruidosa taberna de montaña donde un misterioso encapuchado te ofrece un mapa hacia un templo sumergido en las marismas.";
    } else if (adventureState.preset === 'space') {
      startingScenario = "Vórtice Perdido: Eres el capitán de la nave de exploración 'Horizonte'. Acabas de saltar de emergencia a un cuadrante desconocido. Delante de ti flota silenciosamente un carguero espacial clase titán abandonado, con lecturas de energía intermitentes.";
    } else {
      startingScenario = advCustomScenario.value.trim();
      if (!startingScenario) {
        showToast('Escribe un escenario inicial para tu aventura personalizada.', 'warning');
        return;
      }
    }

    // Initialize state
    adventureState.isActive = true;
    adventureState.history = [
      {
        role: "system",
        content: `Eres el narrador experto de un juego de rol de texto interactivo. El escenario es: "${startingScenario}". Debes narrar la historia y responder ÚNICAMENTE en español. Describe el punto de partida detallada y atmosféricamente (máximo 2 párrafos). Termina siempre haciéndole una pregunta clara y directa al jugador sobre qué decide hacer. Sé descriptivo, inmersivo y reactivo. No decidas las acciones del jugador por él.`
      }
    ];

    clearEl(advStoryLog);
    advSetupContainer.classList.add('hidden');
    advGameContainer.classList.remove('hidden');
    
    appendStoryBlock('system-info', 'Iniciando aventura y contactando al narrador...');
    
    // Request initial block
    await sendAdventureTurn(true);
  }

  async function sendAdventureTurn(isFirstTurn = false) {
    const userAction = advActionInput.value.trim();
    if (!isFirstTurn && !userAction) return;

    if (!isFirstTurn) {
      appendStoryBlock('action', `> ${userAction}`);
      adventureState.history.push({ role: 'user', content: userAction });
      advActionInput.value = '';
    }

    advSendBtn.disabled = true;
    advActionInput.disabled = true;
    const spinner = advSendBtn.querySelector('.spinner');
    const btnText = advSendBtn.querySelector('.btn-text');
    spinner.classList.remove('hidden');
    btnText.textContent = 'Narrando...';
    advCancelBtn.classList.remove('hidden');

    currentAbortController = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: adventureState.history
        }),
        signal: currentAbortController.signal
      });

      const data = await handleApiResponse(res);
      
      const responseText = data.message?.content || data.response || "El narrador se ha quedado en silencio.";
      
      // Remove loading indicator if any
      const infoBlocks = advStoryLog.querySelectorAll('.system-info');
      infoBlocks.forEach(b => {
        if (b.textContent.includes('Iniciando') || b.textContent.includes('Esperando')) {
          advStoryLog.removeChild(b);
        }
      });

      appendStoryBlock('narrative', responseText);
      adventureState.history.push({ role: 'assistant', content: responseText });
      
      // Save state to localStorage
      localStorage.setItem('ollama_adventure_state', JSON.stringify(adventureState));
    } catch (err) {
      if (err.name === 'AbortError') {
        appendStoryBlock('system-info', 'La narración fue cancelada.');
        return;
      }
      appendStoryBlock('system-info', `Error de conexión: No se pudo contactar al narrador local. Detalles: ${err.message}`);
      showToast('Error al conectar con la IA.', 'error');
    } finally {
      currentAbortController = null;
      advSendBtn.disabled = false;
      advActionInput.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = 'Enviar Acción';
      advCancelBtn.classList.add('hidden');
      advActionInput.focus();
    }
  }

  function resetAdventure() {
    localStorage.removeItem('ollama_adventure_state');
    adventureState.isActive = false;
    adventureState.history = [];
    advGameContainer.classList.add('hidden');
    advSetupContainer.classList.remove('hidden');
    clearEl(advStoryLog);
  }

  advStartBtn.addEventListener('click', startAdventure);
  advCancelBtn.addEventListener('click', () => {
    if (currentAbortController) currentAbortController.abort();
  });
  advSendBtn.addEventListener('click', () => sendAdventureTurn(false));
  advActionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdventureTurn(false);
    }
  });
  advResetBtn.addEventListener('click', resetAdventure);
  advCopyBtn.addEventListener('click', () => {
    if (!adventureState.history || adventureState.history.length === 0) {
      showToast('No hay ninguna historia activa que copiar.', 'warning');
      return;
    }
    const formattedHistory = adventureState.history
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        const prefix = msg.role === 'user' ? 'Jugador' : 'Narrador';
        return `**${prefix}:** ${msg.content}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(formattedHistory).then(() => {
      showToast('Historia copiada al portapapeles.', 'success');
    });
  });

  // Restore active adventure on load if exists
  const savedAdv = localStorage.getItem('ollama_adventure_state');
  if (savedAdv) {
    try {
      const parsed = JSON.parse(savedAdv);
      if (parsed.isActive && parsed.history.length > 0) {
        adventureState = parsed;
        advSetupContainer.classList.add('hidden');
        advGameContainer.classList.remove('hidden');
        
        // Render story history
        adventureState.history.forEach(msg => {
          if (msg.role === 'user') {
            appendStoryBlock('action', `> ${msg.content}`);
          } else if (msg.role === 'assistant') {
            appendStoryBlock('narrative', msg.content);
          }
        });
      }
    } catch (e) {
      localStorage.removeItem('ollama_adventure_state');
    }
  }

  /* 4. Muse Section Logic */
  museTextEditor.addEventListener('input', () => {
    const chars = museTextEditor.value.length;
    museCharCount.textContent = `${chars} caracteres`;
  });

  async function triggerMuseAction(actionType, promptTemplate) {
    const editorText = museTextEditor.value.trim();
    if (!editorText) {
      showToast('Por favor, escribe algo en el lienzo de escritura primero.', 'warning');
      return;
    }

    if (!activeModel) {
      showToast('Selecciona un modelo de Ollama activo para inspirarte.', 'warning');
      return;
    }

    // Show suggestion card and loading state
    museSuggestionCard.classList.remove('hidden');
    const museSpinner = museSuggestionCard.querySelector('.muse-spinner');
    museSpinner.classList.remove('hidden');
    
    clearEl(museResultText);
    museResultText.appendChild(createEl('span', 'loading-text', 'La musa está reflexionando en las sombras...'));
    
    // Disable muse controls
    museExpandBtn.disabled = true;
    museTwistBtn.disabled = true;
    museToneBtn.disabled = true;
    museCancelBtn.classList.remove('hidden');

    currentAbortController = new AbortController();

    const fullPrompt = promptTemplate.replace('{text}', editorText);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: fullPrompt,
          system: "Eres una musa literaria servicial y experta en escritura creativa en español. Ofreces continuaciones, giros de guión o revisiones directas. Debes escribir e inspirar ÚNICAMENTE en español. Responde únicamente con el texto literario solicitado, sin preámbulos, explicaciones ni saludos."
        }),
        signal: currentAbortController.signal
      });

      const data = await handleApiResponse(res);
      const result = data.response || "No se obtuvo respuesta de la musa.";
      
      renderMarkdownToContainer(museResultText, result);
    } catch (err) {
      if (err.name === 'AbortError') {
        clearEl(museResultText);
        museResultText.textContent = "La inspiración fue interrumpida.";
        return;
      }
      clearEl(museResultText);
      museResultText.textContent = `La musa no pudo inspirarse debido a un error: ${err.message}`;
      showToast('Error de comunicación con Ollama.', 'error');
    } finally {
      currentAbortController = null;
      museSpinner.classList.add('hidden');
      museCancelBtn.classList.add('hidden');
      museExpandBtn.disabled = false;
      museTwistBtn.disabled = false;
      museToneBtn.disabled = false;
    }
  }

  museCancelBtn.addEventListener('click', () => {
    if (currentAbortController) currentAbortController.abort();
  });

  museExpandBtn.addEventListener('click', () => {
    triggerMuseAction('expand', "Expande y enriquece literariamente el siguiente texto. Añade descripciones sensoriales, metáforas adecuadas y profundidad emocional sin cambiar la trama original:\n\n{text}");
  });

  museTwistBtn.addEventListener('click', () => {
    triggerMuseAction('twist', "Introduce un giro argumental repentino, un conflicto imprevisto o una revelación misteriosa que altere el curso de la historia a partir de este punto:\n\n{text}");
  });

  museToneBtn.addEventListener('click', () => {
    const toneVal = museToneSelect.value;
    let tonePrompt = "";
    if (toneVal === 'oscuro') tonePrompt = "oscuro, gótico y melancólico";
    else if (toneVal === 'cyberpunk') tonePrompt = "cyberpunk futurista, tecnológico y descarnado";
    else if (toneVal === 'poetico') tonePrompt = "lírico, poético y reflexivo, usando bella prosa";
    else tonePrompt = "irónico, satírico y sutilmente cómico";

    triggerMuseAction('tone', `Reescribe el siguiente texto para que tenga un tono marcadamente ${tonePrompt}, adaptando las palabras y el ambiente pero manteniendo la esencia básica de la escena:\n\n{text}`);
  });

  museApplyBtn.addEventListener('click', () => {
    const textToApply = museResultText.textContent;
    if (textToApply && !textToApply.startsWith('La musa está') && !textToApply.startsWith('La musa no pudo')) {
      // Append or replace
      museTextEditor.value = museTextEditor.value + "\n\n" + textToApply;
      museCharCount.textContent = `${museTextEditor.value.length} caracteres`;
      showToast('Texto aplicado al lienzo con éxito.', 'success');
      museSuggestionCard.classList.add('hidden');
    }
  });

  museCopyBtn.addEventListener('click', () => {
    const textToCopy = museResultText.textContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Texto copiado al portapapeles.', 'success');
      });
    }
  });

  museCopyCanvasBtn.addEventListener('click', () => {
    const textToCopy = museTextEditor.value.trim();
    if (!textToCopy) {
      showToast('No hay texto en el lienzo para copiar.', 'warning');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Lienzo de escritura copiado al portapapeles.', 'success');
    });
  });

  /* 5. Worldbuilder Section Logic */
  async function generateWorldElement() {
    if (!activeModel) {
      showToast('Selecciona un modelo de Ollama antes de forjar lore.', 'warning');
      return;
    }

    const type = wbType.value;
    const genre = wbGenre.value;
    const context = wbContext.value.trim();

    wbGenerateBtn.disabled = true;
    const spinner = wbGenerateBtn.querySelector('.spinner');
    const btnText = wbGenerateBtn.querySelector('.btn-text');
    spinner.classList.remove('hidden');
    btnText.textContent = 'Forjando...';
    wbResultCard.classList.add('hidden');
    wbCancelBtn.classList.remove('hidden');

    currentAbortController = new AbortController();

    let genreLabel = wbGenre.options[wbGenre.selectedIndex].textContent;
    let typeLabel = wbType.options[wbType.selectedIndex].textContent;

    let prompt = `Genera una ficha detallada e inspiradora de un elemento del tipo '${typeLabel}' diseñado para encajar en un mundo de género '${genreLabel}'.`;
    if (context) {
      prompt += ` Incorpora este detalle clave: "${context}".`;
    }
    prompt += `\nOrganiza la información con las siguientes secciones:
- Nombre sugerido (evocador y temático)
- Descripción visual y atmósfera
- Historia y Origen
- Importancia / Rol en el mundo
- Un Secreto o Rumor Misterioso`;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          system: "Eres un forjador de mundos fantástico y narrador de juegos de rol. Creas lore extremadamente original, sugerente y estructurado en español. Debes generar toda la información ÚNICAMENTE en español. Evita clichés y responde con un formato estructurado y limpio."
        }),
        signal: currentAbortController.signal
      });

      const data = await handleApiResponse(res);
      
      wbResultTitle.textContent = `Forja: ${typeLabel} (${genreLabel})`;
      renderMarkdownToContainer(wbResultBody, data.response || "No se pudo forjar el elemento.");
      wbResultCard.classList.remove('hidden');
      wbResultCard.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Forja cancelada.', 'info');
        return;
      }
      showToast(`Error al forjar lore: ${err.message}`, 'error');
    } finally {
      currentAbortController = null;
      wbGenerateBtn.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = 'Forjar Elemento';
      wbCancelBtn.classList.add('hidden');
    }
  }

  wbCancelBtn.addEventListener('click', () => {
    if (currentAbortController) currentAbortController.abort();
  });
  wbGenerateBtn.addEventListener('click', generateWorldElement);
  wbCopyBtn.addEventListener('click', () => {
    const textToCopy = wbResultBody.textContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Lore copiado al portapapeles.', 'success');
      });
    }
  });

  /* 6. Oracle Section Logic */
  function getActivePersona() {
    return oraclePersona.value;
  }

  function appendChatBubble(role, text) {
    const bubble = createEl('div', `chat-bubble ${role}`);
    renderMarkdownToContainer(bubble, text);
    oracleChatLog.appendChild(bubble);
    oracleChatLog.scrollTop = oracleChatLog.scrollHeight;
  }

  function changeOraclePersona() {
    const key = getActivePersona();
    const config = oraclePersonas[key];
    
    personaDescText.textContent = config.desc;
    
    // Clear chat log
    clearEl(oracleChatLog);
    
    // Load history or insert greeting
    const sessionKey = `ollama_oracle_history_${key}`;
    const savedHistory = localStorage.getItem(sessionKey);
    
    if (savedHistory) {
      try {
        oracleHistory[key] = JSON.parse(savedHistory);
        // Render history
        oracleHistory[key].forEach(msg => {
          if (msg.role !== 'system') {
            appendChatBubble(msg.role, msg.content);
          }
        });
      } catch (e) {
        initializeNewOracleChat(key, config);
      }
    } else {
      initializeNewOracleChat(key, config);
    }
  }

  function initializeNewOracleChat(key, config) {
    oracleHistory[key] = [
      { role: "system", content: config.system },
      { role: "assistant", content: config.greeting }
    ];
    appendChatBubble('assistant', config.greeting);
    localStorage.setItem(`ollama_oracle_history_${key}`, JSON.stringify(oracleHistory[key]));
  }

  async function askOracle() {
    const promptText = oracleChatInput.value.trim();
    if (!promptText) return;

    if (!activeModel) {
      showToast('Selecciona un modelo de Ollama activo para hablar con el Oráculo.', 'warning');
      return;
    }

    const key = getActivePersona();
    const history = oracleHistory[key] || [];

    appendChatBubble('user', promptText);
    history.push({ role: 'user', content: promptText });
    oracleChatInput.value = '';

    oracleChatBtn.disabled = true;
    oracleChatInput.disabled = true;
    const spinner = oracleChatBtn.querySelector('.spinner');
    const btnText = oracleChatBtn.querySelector('.btn-text');
    spinner.classList.remove('hidden');
    btnText.textContent = 'Procesando...';
    oracleCancelBtn.classList.remove('hidden');

    currentAbortController = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: history
        }),
        signal: currentAbortController.signal
      });

      const data = await handleApiResponse(res);
      
      const responseText = data.message?.content || data.response || "El oráculo permanece enigmáticamente en silencio.";
      
      appendChatBubble('assistant', responseText);
      history.push({ role: 'assistant', content: responseText });
      
      localStorage.setItem(`ollama_oracle_history_${key}`, JSON.stringify(history));
    } catch (err) {
      if (err.name === 'AbortError') {
        appendChatBubble('assistant', '*(El oráculo ha interrumpido la conexión)*');
        return;
      }
      appendChatBubble('assistant', `El canal astral digital se ha quebrado: ${err.message}`);
      showToast('Error de conexión con el Oráculo.', 'error');
    } finally {
      currentAbortController = null;
      oracleChatBtn.disabled = false;
      oracleChatInput.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = 'Preguntar';
      oracleCancelBtn.classList.add('hidden');
      oracleChatInput.focus();
    }
  }

  function clearOracleChat() {
    const key = getActivePersona();
    localStorage.removeItem(`ollama_oracle_history_${key}`);
    changeOraclePersona();
    showToast('Conversación reiniciada.', 'info');
  }

  oracleCancelBtn.addEventListener('click', () => {
    if (currentAbortController) currentAbortController.abort();
  });
  oraclePersona.addEventListener('change', changeOraclePersona);
  oracleChatBtn.addEventListener('click', askOracle);
  oracleChatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askOracle();
    }
  });
  oracleClearBtn.addEventListener('click', clearOracleChat);
  oracleCopyBtn.addEventListener('click', () => {
    const key = getActivePersona();
    const history = oracleHistory[key] || [];
    const filtered = history.filter(msg => msg.role !== 'system');
    if (filtered.length <= 1) {
      showToast('No hay conversación activa para copiar.', 'warning');
      return;
    }
    const personaName = oraclePersonas[key].name;
    const formattedChat = filtered
      .map(msg => {
        const prefix = msg.role === 'user' ? 'Tú' : personaName;
        return `**${prefix}:** ${msg.content}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(formattedChat).then(() => {
      showToast('Conversación copiada al portapapeles.', 'success');
    });
  });

  // Initialize Oracle tab
  changeOraclePersona();
});
