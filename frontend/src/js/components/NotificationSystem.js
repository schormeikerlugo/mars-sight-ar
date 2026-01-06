/**
 * KEPLER Notification System
 * Handles holographic HUD alerts, audio feedback, and persistent history.
 */
import { notificationStore } from '../services/NotificationStore.js';

export class NotificationSystem {
    constructor() {
        this.container = null;
        this.logPanel = null;
        this.sounds = {};

        this.init();
    }

    init() {
        // 1. Create Toast Container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        document.body.appendChild(this.container);

        // 2. Create Log Panel (Bitácora)
        this.logPanel = document.createElement('div');
        this.logPanel.id = 'notification-log-panel';
        this.logPanel.innerHTML = `
            <div class="log-header">
                <span class="log-title">📜 BITÁCORA DEL SISTEMA</span>
                <div class="log-actions">
                    <button class="log-clear-all" title="Borrar todo">🗑️</button>
                    <button class="log-close">×</button>
                </div>
            </div>
            <div class="log-content" id="log-content"></div>
        `;
        document.body.appendChild(this.logPanel);

        // Bind Close
        this.logPanel.querySelector('.log-close').onclick = () => this.toggleLog(false);

        // Bind Clear All
        this.logPanel.querySelector('.log-clear-all').onclick = () => {
            if (confirm('¿Borrar toda la bitácora?')) {
                notificationStore.clearAll();
                this.updateLogUI();
            }
        };

        // 3. Preload Sounds
        const audioPath = '/assets/song/notifications/';
        this.sounds = {
            critical: new Audio(`${audioPath}critical.wav`),
            warning: new Audio(`${audioPath}warning.mp3`),
            success: new Audio(`${audioPath}success.wav`),
            info: new Audio(`${audioPath}success.wav`) // Fallback
        };

        // Adjust volumes
        this.sounds.critical.volume = 0.8;
        this.sounds.warning.volume = 0.6;
        this.sounds.success.volume = 0.5;
        this.sounds.info.volume = 0.3;

        // Initial render of history
        this.updateLogUI();
    }

    /**
     * Show a notification
     * @param {string} message - Content
     * @param {string} type - 'critical' | 'warning' | 'success' | 'info'
     * @param {number} duration - ms (0 for persistent)
     */
    show(message, type = 'info', duration = 5000) {
        // Save to persistent store
        const id = notificationStore.add(message, type);

        // Create toast element
        const notification = document.createElement('div');
        notification.className = `holo-notification ${type}`;
        notification.dataset.id = id;
        notification.innerHTML = `
            <div class="holo-notification-content">
                <div class="holo-notification-title">
                    ${this.getIcon(type)} ${type.toUpperCase()}
                </div>
                <div class="holo-notification-message">${message.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        // Click to dismiss
        notification.onclick = () => this.dismiss(notification);

        this.container.appendChild(notification);
        this.playSound(type);

        // GLITCH EFFECT (Critical)
        if (type === 'critical') {
            document.body.classList.add('system-failure-glitch');
            setTimeout(() => {
                document.body.classList.remove('system-failure-glitch');
            }, 600);
        }

        // Update log UI
        this.updateLogUI();
        this.updateBadge();

        // Auto Dismiss
        if (duration > 0 && type !== 'critical') {
            setTimeout(() => {
                if (notification.isConnected) this.dismiss(notification);
            }, duration);
        }

        return id;
    }

    toggleLog(forceState = null) {
        const isOpen = this.logPanel.classList.contains('open');
        const newState = forceState !== null ? forceState : !isOpen;

        if (newState) {
            this.logPanel.classList.add('open');
            this.updateBadgeToZero();
        } else {
            this.logPanel.classList.remove('open');
        }
    }

    updateLogUI() {
        const content = this.logPanel.querySelector('#log-content');
        if (!content) return;

        const sortedDates = notificationStore.getSortedDates();
        const grouped = notificationStore.getGroupedByDate();

        if (sortedDates.length === 0) {
            content.innerHTML = '<div class="empty-log">Sin registros recientes</div>';
            return;
        }

        // Build timeline HTML
        let html = '';
        for (const date of sortedDates) {
            const dateLabel = this.formatDateLabel(date);
            const notifications = grouped[date];

            html += `
                <div class="log-date-group">
                    <div class="log-date-header">
                        <span class="log-date-label">📅 ${dateLabel}</span>
                        <button class="log-date-delete" data-date="${date}" title="Borrar día">🗑️</button>
                    </div>
                    <div class="log-date-items">
            `;

            for (const item of notifications) {
                const time = new Date(item.timestamp).toLocaleTimeString();
                html += `
                    <div class="log-item ${item.type}">
                        <span class="log-icon">${this.getIcon(item.type)}</span>
                        <div class="log-item-content">
                            <div class="log-item-message">${item.message.replace(/\n/g, '<br>')}</div>
                            <span class="log-time">${time}</span>
                        </div>
                        <button class="log-item-delete" data-id="${item.id}" title="Borrar">×</button>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        content.innerHTML = html;

        // Bind delete handlers
        content.querySelectorAll('.log-date-delete').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const date = btn.dataset.date;
                if (confirm(`¿Borrar todos los registros del ${this.formatDateLabel(date)}?`)) {
                    notificationStore.deleteByDate(date);
                    this.updateLogUI();
                }
            };
        });

        content.querySelectorAll('.log-item-delete').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                notificationStore.deleteById(btn.dataset.id);
                this.updateLogUI();
            };
        });
    }

    formatDateLabel(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) {
            return 'Hoy';
        } else if (dateStr === yesterday.toISOString().split('T')[0]) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'short'
            });
        }
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            const count = notificationStore.countToday();
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    updateBadgeToZero() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }

    dismiss(element) {
        element.classList.add('hiding');
        element.addEventListener('animationend', () => {
            if (element.isConnected) element.remove();
        });
    }

    playSound(type) {
        const sound = this.sounds[type] || this.sounds.info;
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn("Audio blocked:", e));
        }
    }

    getIcon(type) {
        switch (type) {
            case 'critical': return '🚨';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return '🔹';
        }
    }

    // Shortcuts
    critical(msg) { this.show(msg, 'critical', 0); } // Persistent
    warning(msg) { this.show(msg, 'warning', 7000); }
    success(msg) { this.show(msg, 'success', 4000); }
    info(msg) { this.show(msg, 'info', 5000); }
}
