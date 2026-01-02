/**
 * Mobile Menu Module
 * Handles hamburger menu toggle, navigation, and mobile-specific interactions
 */

import { auth } from '../../../js/auth.js';

export function initMobileMenu(user, missionModal) {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close');

    const openMobileMenu = () => {
        if (mobileNav) mobileNav.classList.add('active');
        if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileMenu = () => {
        if (mobileNav) mobileNav.classList.remove('active');
        if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Toggle button
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }

    // Close button
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMobileMenu);
    }

    // Overlay click to close
    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileMenu);
    }

    // Update mobile user info
    if (user) {
        const mobileUserName = document.getElementById('mobile-user-name');
        const mobileUserEmail = document.getElementById('mobile-user-email');
        const mobileUserAvatar = document.getElementById('mobile-user-avatar');

        if (mobileUserName) mobileUserName.textContent = user.email.split('@')[0];
        if (mobileUserEmail) mobileUserEmail.textContent = user.email;
        if (mobileUserAvatar) mobileUserAvatar.textContent = user.email[0].toUpperCase();
    }

    // Mobile menu button handlers
    const mobileBtnStartMission = document.getElementById('mobile-btn-start-mission');
    const mobileBtnArchives = document.getElementById('mobile-btn-archives');
    const mobileBtnTaxonomia = document.getElementById('mobile-btn-taxonomia');
    const mobileBtnLogout = document.getElementById('mobile-btn-logout');

    if (mobileBtnStartMission) {
        mobileBtnStartMission.addEventListener('click', () => {
            closeMobileMenu();
            if (missionModal) missionModal.style.display = 'flex';
        });
    }

    if (mobileBtnArchives) {
        mobileBtnArchives.addEventListener('click', () => {
            window.location.href = '/src/features/archives/archives.html';
        });
    }

    if (mobileBtnTaxonomia) {
        mobileBtnTaxonomia.addEventListener('click', () => {
            window.location.href = '/src/features/taxonomia/taxonomia.html';
        });
    }

    if (mobileBtnLogout) {
        mobileBtnLogout.addEventListener('click', async () => {
            await auth.logout();
            window.location.href = '/';
        });
    }
}
