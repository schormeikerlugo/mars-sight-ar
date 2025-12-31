import { auth } from '../../js/auth.js';
import { api } from '../../js/services/api.js';
import { dbService } from '../../js/services/DatabaseService.js';

import './dashboard.css';
import template from './dashboard.html?raw';

export async function render(container) {
    const user = await auth.getUser();

    // Inject Template
    container.innerHTML = template;

    // Update User Profile
    if (user) {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const dropdownEmail = document.getElementById('dropdown-email');

        if (nameEl) nameEl.textContent = user.email.split('@')[0];
        if (avatarEl) avatarEl.textContent = user.email[0].toUpperCase();
        if (dropdownEmail) dropdownEmail.textContent = user.email;
    }

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById('btn-user-profile');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('btn-logout');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
        });

        profileDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.logout();
            window.location.href = '/';
        });
    }

    // Start Mission Button Logic
    const startBtn = document.getElementById('btn-start-mission');
    const missionModal = document.getElementById('mission-modal');
    const closeMissionBtn = document.getElementById('btn-close-mission');
    const confirmMissionBtn = document.getElementById('btn-confirm-start-mission');

    if (startBtn && missionModal) {
        // 1. Open Modal
        startBtn.addEventListener('click', () => {
            missionModal.style.display = 'flex';
        });

        // 2. Close Modal
        if (closeMissionBtn) {
            closeMissionBtn.addEventListener('click', () => {
                missionModal.style.display = 'none';
            });
        }

        // 3. Confirm Start
        if (confirmMissionBtn) {
            confirmMissionBtn.addEventListener('click', async () => {
                const titleInput = document.getElementById('inp-dash-mission-title');
                const zoneInput = document.getElementById('inp-dash-mission-zone');

                const title = titleInput.value || "Misión Exploración";
                const zone = zoneInput.value || "Sector Desconocido";

                try {
                    confirmMissionBtn.textContent = 'Iniciando...';
                    await dbService.startMission(title, zone);
                    // Navigate
                    window.history.pushState({}, '', '/ar');
                    window.location.reload();
                } catch (e) {
                    console.error("Error starting mission:", e);
                    alert("Error al iniciar misión. Revisa consola.");
                    confirmMissionBtn.textContent = 'DESPEGAR 🚀';
                }
            });
        }
    }

    // Archives Button Logic
    const archivesBtn = document.getElementById('btn-archives');
    if (archivesBtn) {
        archivesBtn.addEventListener('click', () => {
            window.location.href = '/src/features/archives/archives.html';
        });
    }

    // Taxonomy Button Logic
    const taxonomiaBtn = document.getElementById('btn-taxonomia');
    if (taxonomiaBtn) {
        taxonomiaBtn.addEventListener('click', () => {
            window.location.href = '/taxonomia';
        });
    }

    // Initialize Features
    pollTelemetry();
    initChat();
    loadDashboardData();
}

// --- TELEMETRY ---
async function pollTelemetry() {
    const tTemp = document.getElementById('telem-temp');
    const tO2 = document.getElementById('telem-o2');
    const tBpm = document.getElementById('telem-bpm');
    const tRad = document.getElementById('telem-rad');

    const update = async () => {
        if (!document.getElementById('telem-temp')) return;

        try {
            const data = await api.getTelemetry();

            if (data) {
                if (tTemp) tTemp.textContent = data.temperature + '°C';
                if (tO2) tO2.textContent = data.oxygen_level + '%';
                if (tBpm) tBpm.textContent = data.heart_rate;
                if (tRad) tRad.textContent = data.radiation;
            } else {
                // Fallback Simulation
                if (tTemp) tTemp.textContent = (20 + Math.random() * 0.5).toFixed(1) + '°C';
                if (tO2) tO2.textContent = (96 + Math.random() * 0.2).toFixed(1) + '%';
                if (tBpm) tBpm.textContent = Math.floor(75 + Math.random() * 5);
                if (tRad) tRad.textContent = (0.011 + Math.random() * 0.001).toFixed(3);
            }

        } catch (err) { console.error(err); }

        setTimeout(update, 2000);
    };
    update();
}

// --- CHAT WITH HISTORY ---
function initChat() {
    let currentChatId = null;

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-chat');
    const messagesContainer = document.getElementById('chat-messages');
    const suggestions = document.getElementById('chat-suggestions');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');

    // History UI
    const historyBtn = document.getElementById('btn-chat-history');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const closeHistoryBtn = document.getElementById('btn-close-history');
    const newChatBtn = document.getElementById('btn-new-chat');

    const appendMessage = (text, isAi = false, animate = true) => {
        const msg = document.createElement('div');
        msg.className = `chat-message ${isAi ? 'ai-message' : 'user-message'}`;
        messagesContainer.appendChild(msg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (!isAi || !animate) {
            msg.textContent = text;
            return;
        }

        // DECODING EFFECT FOR AI (Typewriter with Scrambled Head)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";
        let i = 0;
        const speed = 10; // 33% faster (15ms -> 10ms)

        let interval = setInterval(() => {
            // 1. Text that is already "decoded" and stable
            const clean = text.substring(0, i);

            // 2. The "Decoding Cursor" (next few chars are scrambled)
            let scrambledCursor = "";
            if (i < text.length) {
                // Show 5 random chars as the "writing head" (Longer trail)
                for (let j = 0; j < 5; j++) {
                    scrambledCursor += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            msg.innerText = clean + scrambledCursor;

            // Scroll to bottom as we type
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            i++;

            if (i > text.length) {
                clearInterval(interval);
                msg.innerText = text; // Final clean state
            }

        }, speed);
    };

    const handleSend = async (text) => {
        if (!text.trim()) return;

        // Hide suggestions on first interaction
        if (suggestions) suggestions.style.display = 'none';

        appendMessage(text, false); // User msg
        if (input) input.value = '';

        // UI Loading state
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message ai-message loading';
        loadingMsg.textContent = '...';
        messagesContainer.appendChild(loadingMsg);

        try {
            // Pass currentChatId to persist or link message
            const res = await api.chat(text, "", currentChatId);
            messagesContainer.removeChild(loadingMsg);

            if (res.response) {
                appendMessage(res.response, true);
                // Update ID if new chat created
                if (res.chat_id) {
                    currentChatId = res.chat_id;
                }
            } else {
                appendMessage("Error: No hubo respuesta.", true);
            }
        } catch (e) {
            messagesContainer.removeChild(loadingMsg);
            appendMessage("Error de conexión.", true);
        }
    };

    // Events
    if (sendBtn && input) {
        sendBtn.addEventListener('click', () => handleSend(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend(input.value);
        });
    }

    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            handleSend(btn.dataset.prompt);
        });
    });

    // --- HISTORY MANAGEMENT ---

    if (historyBtn && historyModal) {
        historyBtn.addEventListener('click', async () => {
            historyModal.style.display = 'flex';
            loadHistoryList();
        });

        closeHistoryBtn.addEventListener('click', () => {
            historyModal.style.display = 'none';
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            currentChatId = null; // Reset ID logic
            messagesContainer.innerHTML = ''; // Clear UI
            // Add Welcome
            appendMessage("Nueva sesión iniciada. ¿En qué puedo ayudarte?", true);

            if (historyModal) historyModal.style.display = 'none';
            if (suggestions) suggestions.style.display = 'flex';
        });
    }

    async function loadHistoryList() {
        historyList.innerHTML = '<div class="history-item loading">Cargando...</div>';
        const history = await api.getChatHistory();

        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<div style="padding:10px; color:#666;">Sin conversaciones previas.</div>';
            return;
        }

        history.forEach(chat => {
            const date = new Date(chat.date).toLocaleDateString();
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-info">
                   <div style="font-weight:bold; color:#fff;">${chat.title || 'Conversación'}</div>
                   <div class="history-meta">${date}</div>
                </div>
                <div class="history-actions">
                    <button class="btn-edit-chat" data-id="${chat.id}" title="Renombrar">✎</button>
                    <button class="btn-delete-chat" data-id="${chat.id}" title="Borrar">🗑</button>
                </div>
            `;

            // Click to load (ignore delete/edit btn click)
            el.addEventListener('click', async (e) => {
                const target = e.target;

                if (target.classList.contains('btn-delete-chat')) {
                    if (confirm("¿Borrar esta conversación?")) {
                        await api.deleteChat(chat.id);
                        loadHistoryList();
                    }
                    return;
                }

                if (target.classList.contains('btn-edit-chat')) {
                    const newTitle = prompt("Nuevo título:", chat.title);
                    if (newTitle && newTitle.trim() !== "") {
                        await api.updateChatTitle(chat.id, newTitle.trim());
                        loadHistoryList();
                    }
                    return;
                }

                // Load Logic
                loadChatSession(chat.id);
                historyModal.style.display = 'none';
            });

            historyList.appendChild(el);
        });
    }

    async function loadChatSession(id) {
        currentChatId = id;
        messagesContainer.innerHTML = '<div class="chat-message ai-message">Cargando historial...</div>';

        const chatData = await api.loadChat(id);
        messagesContainer.innerHTML = '';

        if (chatData && chatData.messages) {
            chatData.messages.forEach(msg => {
                appendMessage(msg.content, msg.role === 'assistant', false);
            });
        } else {
            appendMessage("No se pudo cargar el historial.", true);
        }

        if (suggestions) suggestions.style.display = 'none';
    }
}

// --- DASHBOARD DATA ---
async function loadDashboardData() {
    const stats = await api.getDashboardStats();

    // Update Counts
    const updateCount = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    if (stats.counts) {
        updateCount('pois-count', stats.counts.pois);
        updateCount('minerals-count', stats.counts.minerals);
        updateCount('missions-count', stats.counts.missions);
        updateCount('objects-count', stats.counts.objects);
    }

    // Populate Lists (Helper)
    const populateList = (listId, items, formatter) => {
        const container = document.getElementById(listId);
        if (!container) return;
        container.innerHTML = ''; // Clear existing

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="empty-state">No data available</div>';
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'data-item';
            el.innerHTML = formatter(item);
            container.appendChild(el);
        });
    };

    // Formatters
    if (stats.recent) {
        populateList('pois-list', stats.recent.pois, (item) => `
            <div class="item-icon">📍</div>
            <div class="item-info">
                <span class="item-name">${item.nombre || item.name || 'Sin Nombre'}</span>
                <span class="item-sub">${item.tipo || item.type || 'POI'}</span>
            </div>
        `);

        populateList('minerals-list', stats.recent.minerals, (item) => `
            <div class="item-icon">💎</div>
            <div class="item-info">
                <span class="item-name">${item.nombre || item.name || 'Sin Nombre'}</span>
                <span class="item-sub">${item.chemical_formula || 'Unknown'}</span>
            </div>
        `);

        populateList('missions-list', stats.recent.missions, (item) => `
             <div class="item-icon">🚀</div>
             <div class="item-info">
                 <span class="item-name">${item.titulo || item.title || 'Misión'}</span>
                 <span class="item-sub status-${item.estado || item.status || 'unknown'}">${(item.estado || item.status || 'unknown').toUpperCase()}</span>
             </div>
        `);

        populateList('objects-list', stats.recent.objects, (item) => `
             <div class="item-icon">📦</div>
             <div class="item-info">
                 <span class="item-name">${item.nombre || item.name || 'Objeto'}</span>
                 <span class="item-sub">${item.tipo || item.type || 'Desconocido'}</span>
             </div>
        `);
    }
}
