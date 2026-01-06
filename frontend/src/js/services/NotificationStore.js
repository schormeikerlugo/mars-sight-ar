/**
 * NotificationStore - Persistent notification storage with timeline grouping
 * Stores notifications in localStorage, grouped by date for the Bitácora
 */

const STORAGE_KEY = 'kepler_notification_history';
const MAX_HISTORY_DAYS = 30; // Keep last 30 days

export class NotificationStore {
    constructor() {
        this.history = this.load();
        this.cleanup(); // Remove old entries
    }

    /**
     * Load history from localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load notification history:', e);
            return [];
        }
    }

    /**
     * Save history to localStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
        } catch (e) {
            console.warn('Failed to save notification history:', e);
        }
    }

    /**
     * Add a notification to history
     * @param {string} message 
     * @param {string} type - 'critical' | 'warning' | 'success' | 'info'
     * @returns {string} notification ID
     */
    add(message, type) {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        this.history.unshift({
            id,
            message,
            type,
            timestamp,
            date: timestamp.split('T')[0] // YYYY-MM-DD for grouping
        });

        this.save();
        return id;
    }

    /**
     * Delete a single notification by ID
     * @param {string} id 
     */
    deleteById(id) {
        this.history = this.history.filter(n => n.id !== id);
        this.save();
    }

    /**
     * Delete all notifications for a specific date
     * @param {string} date - YYYY-MM-DD format
     */
    deleteByDate(date) {
        this.history = this.history.filter(n => n.date !== date);
        this.save();
    }

    /**
     * Clear all history
     */
    clearAll() {
        this.history = [];
        this.save();
    }

    /**
     * Get all notifications
     */
    getAll() {
        return this.history;
    }

    /**
     * Get notifications grouped by date
     * @returns {Object} { 'YYYY-MM-DD': [notifications], ... }
     */
    getGroupedByDate() {
        const grouped = {};

        for (const notif of this.history) {
            if (!grouped[notif.date]) {
                grouped[notif.date] = [];
            }
            grouped[notif.date].push(notif);
        }

        return grouped;
    }

    /**
     * Get sorted date keys (most recent first)
     */
    getSortedDates() {
        const grouped = this.getGroupedByDate();
        return Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    }

    /**
     * Cleanup old entries beyond MAX_HISTORY_DAYS
     */
    cleanup() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const before = this.history.length;
        this.history = this.history.filter(n => n.date >= cutoffStr);

        if (this.history.length !== before) {
            this.save();
        }
    }

    /**
     * Get count of notifications
     */
    count() {
        return this.history.length;
    }

    /**
     * Get count of notifications for today
     */
    countToday() {
        const today = new Date().toISOString().split('T')[0];
        return this.history.filter(n => n.date === today).length;
    }
}

// Singleton instance
export const notificationStore = new NotificationStore();
