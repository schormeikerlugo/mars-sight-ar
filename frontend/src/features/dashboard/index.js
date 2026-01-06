/**
 * Dashboard Main Module
 * Orchestrates all dashboard functionality by importing modular components
 */

import { auth } from '../../js/auth.js';
import './css/index.css';
import template from './dashboard.html?raw';

// Import modules
import { initMobileMenu } from './modules/mobile-menu.js';
import { initMission } from './modules/mission.js';
import { initTelemetry } from './modules/telemetry.js';
import { initChat } from './modules/chat.js';
import { loadDashboardData } from './modules/dashboard-data.js';

/**
 * Main render function - initializes the dashboard
 * @param {HTMLElement} container - The container element to render into
 */
export async function render(container) {
    // Get current user
    const user = await auth.getUser();

    // Inject template
    container.innerHTML = template;

    // Bind Notification Bell
    const btnBell = document.getElementById('btn-notifications-header');
    if (btnBell) {
        btnBell.onclick = () => {
            if (window.kepler && window.kepler.notify) {
                window.kepler.notify.toggleLog();
            }
        };
    }

    // Service Status Check (Only on session start - first dashboard load)
    if (window.kepler && window.kepler.notify) {
        if (!sessionStorage.getItem('kepler_status_shown')) {
            setTimeout(async () => {
                // Import api dynamically to avoid circular deps
                const { api } = await import('../../js/services/api.js');
                const health = await api.getHealth();

                // Build status message
                const statuses = [
                    `Backend: ${health.backend ? '✅' : '❌'}`,
                    `Base de Datos: ${health.database ? '✅' : '❌'}`,
                    `IA (Llama): ${health.ai ? '✅' : '❌'}`
                ];

                const allGood = health.backend && health.database;

                if (allGood) {
                    window.kepler.notify.success(`Sistemas operativos\n${statuses.join(' | ')}`);
                } else {
                    window.kepler.notify.warning(`Algunos sistemas no responden\n${statuses.join(' | ')}`);
                }

                sessionStorage.setItem('kepler_status_shown', 'true');
            }, 1500);
        }
    }

    // Update user profile in header
    if (user) {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const dropdownEmail = document.getElementById('dropdown-email');

        if (nameEl) nameEl.textContent = user.email.split('@')[0];
        if (avatarEl) avatarEl.textContent = user.email[0].toUpperCase();
        if (dropdownEmail) dropdownEmail.textContent = user.email;
    }

    // Setup profile dropdown
    setupProfileDropdown();

    // Initialize all modules
    const missionModal = initMission();
    initMobileMenu(user, missionModal);
    initTelemetry();
    initChat();
    loadDashboardData();
}

/**
 * Sets up the profile dropdown toggle and logout functionality
 */
function setupProfileDropdown() {
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

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.logout();
            window.location.href = '/';
        });
    }
}
