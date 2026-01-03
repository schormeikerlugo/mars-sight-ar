import './css/tokens.css';
import './css/fonts.css';
import './css/style.css';
import './css/holo-logo.css';

console.log("Mars-Sight AR Vanilla: System Initialized");

import { auth } from './js/auth.js';

console.log("Mars-Sight AR Vanilla: System Initialized");

async function route() {
    const user = await auth.getUser();
    console.log("Auth Status:", user ? "Logged In" : "Guest");

    const path = window.location.pathname;

    // Route Guards
    if (!user && path !== '/login') {
        window.location.href = '/login';
        return;
    }

    if (user && path === '/login') {
        window.location.href = '/';
        return;
    }

    // Routing
    if (path === '/') {
        import('./features/dashboard/index.js').then(module => {
            module.render(document.getElementById('app'));
        });
    } else if (path === '/ar') {
        import('./features/ar/index.js').then(module => {
            module.render(document.getElementById('app'));
        });
    } else if (path === '/login') {
        import('./features/login/index.js').then(module => {
            module.render(document.getElementById('app'));
        });
    } else if (path === '/taxonomia') {
        import('./features/taxonomia/index.js').then(module => {
            const controller = new module.default(document.getElementById('app'));
            controller.init();
        });
    } else {
        // 404 Redirect
        window.location.href = '/';
    }
}

route();