/**
 * Chat Module
 * Handles AI chat, message history, and chat session management
 */

import { api } from '../../../js/services/api.js';

export function initChat() {
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

    // Message append with optional typewriter effect
    const appendMessage = (text, isAi = false, animate = true) => {
        const msg = document.createElement('div');
        msg.className = `chat-message ${isAi ? 'ai-message' : 'user-message'}`;
        messagesContainer.appendChild(msg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (!isAi || !animate) {
            msg.textContent = text;
            return;
        }

        // Typewriter effect with scramble
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";
        let i = 0;
        const speed = 10;

        const interval = setInterval(() => {
            i++;

            let head = text.substring(0, i);
            let scramble = '';
            for (let j = 0; j < 3; j++) {
                scramble += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            msg.innerText = head + scramble;

            if (i > text.length) {
                clearInterval(interval);
                msg.innerText = text;
            }
        }, speed);
    };

    // Send message handler
    const handleSend = async (text) => {
        if (!text.trim()) return;

        if (suggestions) suggestions.style.display = 'none';

        appendMessage(text, false);
        if (input) input.value = '';

        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message ai-message loading';
        loadingMsg.textContent = '...';
        messagesContainer.appendChild(loadingMsg);

        try {
            const res = await api.chat(text, "", currentChatId);
            messagesContainer.removeChild(loadingMsg);

            if (res.response) {
                appendMessage(res.response, true);
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

    // Event bindings
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

    // History management
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
            currentChatId = null;
            messagesContainer.innerHTML = '';
            appendMessage("Nueva sesión iniciada. ¿En qué puedo ayudarte?", true);

            if (historyModal) historyModal.style.display = 'none';
            if (suggestions) suggestions.style.display = 'flex';
        });
    }

    // Load history list
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

                loadChatSession(chat.id);
                historyModal.style.display = 'none';
            });

            historyList.appendChild(el);
        });
    }

    // Load specific chat session
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

        // Also sync to mobile modal if elements exist
        const chatModalMessages = document.getElementById('chat-modal-messages');
        const chatModalWelcome = document.getElementById('chat-modal-welcome');
        const chatModalInputBottom = document.getElementById('chat-modal-input-bottom');

        if (chatModalMessages && messagesContainer) {
            chatModalMessages.innerHTML = messagesContainer.innerHTML;
            // Switch to chat mode in modal
            if (chatModalWelcome) chatModalWelcome.classList.add('hidden');
            if (chatModalMessages) chatModalMessages.classList.add('active');
            if (chatModalInputBottom) chatModalInputBottom.classList.add('active');
        }
    }

    // ========== MOBILE FAB & MODAL (OpenWebUI Style) ==========
    const chatFab = document.getElementById('chat-fab');
    const chatModalOverlay = document.getElementById('chat-modal-overlay');
    const chatModalClose = document.getElementById('chat-modal-close');

    // Welcome state elements
    const chatModalWelcome = document.getElementById('chat-modal-welcome');
    const chatModalInput = document.getElementById('chat-modal-input');
    const btnSendModal = document.getElementById('btn-send-modal');
    const chatModalSuggestions = document.getElementById('chat-modal-suggestions');

    // Active chat state elements
    const chatModalMessages = document.getElementById('chat-modal-messages');
    const chatModalInputBottom = document.getElementById('chat-modal-input-bottom');
    const chatModalInputActive = document.getElementById('chat-modal-input-active');
    const btnSendModalActive = document.getElementById('btn-send-modal-active');

    // Suggestion cards
    const modalSuggestionCards = document.querySelectorAll('.suggestion-card');

    let modalHasMessages = false;

    // Sync messages from main chat to modal
    const syncMessagesToModal = () => {
        if (chatModalMessages && messagesContainer) {
            chatModalMessages.innerHTML = messagesContainer.innerHTML;
            chatModalMessages.scrollTop = chatModalMessages.scrollHeight;

            // Check if there are messages
            modalHasMessages = messagesContainer.children.length > 0;
        }
    };

    // Switch to chat mode (hide welcome, show messages)
    const switchToChatMode = () => {
        if (chatModalWelcome) chatModalWelcome.classList.add('hidden');
        if (chatModalMessages) chatModalMessages.classList.add('active');
        if (chatModalInputBottom) chatModalInputBottom.classList.add('active');
    };

    // Switch to welcome mode
    const switchToWelcomeMode = () => {
        if (chatModalWelcome) chatModalWelcome.classList.remove('hidden');
        if (chatModalMessages) chatModalMessages.classList.remove('active');
        if (chatModalInputBottom) chatModalInputBottom.classList.remove('active');
    };

    // Open modal
    if (chatFab && chatModalOverlay) {
        chatFab.addEventListener('click', () => {
            chatModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Check if modal has its own messages
            const hasModalMessages = chatModalMessages && chatModalMessages.children.length > 0;

            // Show appropriate view based on message state
            if (hasModalMessages) {
                switchToChatMode();
            } else {
                switchToWelcomeMode();
            }
        });
    }

    // Close modal
    if (chatModalClose && chatModalOverlay) {
        chatModalClose.addEventListener('click', () => {
            chatModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Send from modal (welcome state input)
    const handleModalSend = async (text, inputElement) => {
        if (!text.trim()) return;

        // Switch to chat mode
        switchToChatMode();

        // Add user message to modal
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user-message';
        userMsg.textContent = text;
        chatModalMessages.appendChild(userMsg);
        if (inputElement) inputElement.value = '';
        chatModalMessages.scrollTop = chatModalMessages.scrollHeight;

        // Show loading
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message ai-message loading';
        loadingMsg.textContent = '...';
        chatModalMessages.appendChild(loadingMsg);

        try {
            // Make direct API call for modal
            const res = await api.chat(text, "", currentChatId);

            // Remove loading
            if (loadingMsg.parentNode) {
                chatModalMessages.removeChild(loadingMsg);
            }

            if (res.response) {
                // Add AI response to modal with typewriter animation
                const aiMsg = document.createElement('div');
                aiMsg.className = 'chat-message ai-message';
                chatModalMessages.appendChild(aiMsg);
                chatModalMessages.scrollTop = chatModalMessages.scrollHeight;

                // Typewriter effect with scramble (same as desktop)
                const responseText = res.response;
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':,./<>?";
                let i = 0;
                const speed = 10;

                const interval = setInterval(() => {
                    i++;
                    let head = responseText.substring(0, i);
                    let scramble = '';
                    for (let j = 0; j < 3; j++) {
                        scramble += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    aiMsg.innerText = head + scramble;
                    chatModalMessages.scrollTop = chatModalMessages.scrollHeight;

                    if (i > responseText.length) {
                        clearInterval(interval);
                        aiMsg.innerText = responseText;
                    }
                }, speed);

                if (res.chat_id) {
                    currentChatId = res.chat_id;
                }

                // Also add to main chat for sync
                appendMessage(text, false, false);
                appendMessage(res.response, true, false);
            } else {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'chat-message ai-message';
                errorMsg.textContent = 'Error: No hubo respuesta.';
                chatModalMessages.appendChild(errorMsg);
            }
        } catch (e) {
            if (loadingMsg.parentNode) {
                chatModalMessages.removeChild(loadingMsg);
            }
            const errorMsg = document.createElement('div');
            errorMsg.className = 'chat-message ai-message';
            errorMsg.textContent = 'Error de conexión.';
            chatModalMessages.appendChild(errorMsg);
        }
    };

    // Welcome input handlers
    if (btnSendModal && chatModalInput) {
        btnSendModal.addEventListener('click', () => handleModalSend(chatModalInput.value, chatModalInput));
        chatModalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleModalSend(chatModalInput.value, chatModalInput);
        });
    }

    // Active chat input handlers
    if (btnSendModalActive && chatModalInputActive) {
        btnSendModalActive.addEventListener('click', () => handleModalSend(chatModalInputActive.value, chatModalInputActive));
        chatModalInputActive.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleModalSend(chatModalInputActive.value, chatModalInputActive);
        });
    }

    // Suggestion cards click handlers
    modalSuggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.dataset.prompt;
            if (prompt) {
                handleModalSend(prompt, chatModalInput);
            }
        });
    });

    // ========== MENU HANDLERS ==========
    const menuBtn = document.getElementById('chat-modal-menu-btn');
    const menuDropdown = document.getElementById('chat-modal-menu');
    const modalNewChat = document.getElementById('modal-new-chat');
    const modalHistory = document.getElementById('modal-history');
    const modalExit = document.getElementById('modal-exit');

    // Toggle menu
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            menuDropdown.classList.remove('active');
        });
    }

    // New Chat
    if (modalNewChat) {
        modalNewChat.addEventListener('click', () => {
            currentChatId = null;
            messagesContainer.innerHTML = '';
            chatModalMessages.innerHTML = '';
            modalHasMessages = false;
            switchToWelcomeMode();
            menuDropdown.classList.remove('active');
            if (suggestions) suggestions.style.display = 'flex';
        });
    }

    // History - open main history modal (keep chat open in background)
    if (modalHistory && historyModal) {
        modalHistory.addEventListener('click', () => {
            menuDropdown.classList.remove('active');
            // Don't close chat modal - show history on top
            historyModal.style.display = 'flex';
            loadHistoryList();
        });
    }

    // Exit to dashboard
    if (modalExit) {
        modalExit.addEventListener('click', () => {
            menuDropdown.classList.remove('active');
            chatModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}
