/**
 * Profile Page - Main Orchestrator
 * KEPLER Project
 * 
 * This file orchestrates all profile modules:
 * - modules/profile-data.js - Data loading and UI population
 * - modules/form.js - Form handling
 * - modules/avatar.js - Avatar modal and upload
 * - modules/stats.js - User statistics
 * - modules/security.js - Security options
 */

import { auth } from '../../js/auth.js';
import profileHTML from './profile.html?raw';
import './profile.css';

// Import modules
import { loadProfile, populateProfileUI } from './modules/profile-data.js';
import { setupProfileForm } from './modules/form.js';
import { setupAvatarModal } from './modules/avatar.js';
import { loadStats } from './modules/stats.js';
import { setupSecurityButtons } from './modules/security.js';

/**
 * Main render function - initializes the profile page
 * @param {HTMLElement} container - The container element to render into
 */
export async function render(container) {
    // Get current user
    const user = await auth.getUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    // Inject template
    container.innerHTML = profileHTML;

    // Load profile data
    const profile = await loadProfile(user.id);

    // Populate UI with profile data
    populateProfileUI(user, profile);

    // Load user statistics
    await loadStats(user.id);

    // Setup modules
    setupProfileForm(user.id, profile);
    setupAvatarModal(user.id, profile);
    setupSecurityButtons();

    // Back button
    setupBackButton();
}

/**
 * Setup back button navigation
 */
function setupBackButton() {
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
}
