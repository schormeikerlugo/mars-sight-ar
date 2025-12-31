import { auth } from '../../js/auth.js';
import './login.css';
import template from './login.html?raw';

export function render(container) {
    container.innerHTML = template;

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');

    // LOGIN
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        handleAuth('login');
    });

    // REGISTER
    btnRegister.addEventListener('click', async () => {
        handleAuth('register');
    });

    async function handleAuth(mode) {
        const isLogin = mode === 'login';
        const btn = isLogin ? btnLogin : btnRegister;
        const processText = isLogin ? "VERIFICANDO..." : "REGISTRANDO...";
        const successText = isLogin ? "ACCESO CONCEDIDO" : "REGISTRO COMPLETADO";
        
        btn.textContent = processText;
        if(isLogin) btnLogin.disabled = true;
        errorMsg.textContent = "";

        const email = emailInput.value;
        const password = passInput.value;

        try {
            const { user, error } = isLogin ? await auth.login(email, password) : await auth.register(email, password);

            if (error) {
                console.error("Auth Error:", error);
                if (error.message && error.message.includes("Failed to fetch")) {
                    errorMsg.textContent = "ERROR DE RED: No se puede conectar al servidor.";
                } else {
                    errorMsg.textContent = "ERROR: " + error.message;
                }
                btn.textContent = isLogin ? "INICIAR CONEXIÓN" : "REGISTRAR COMANDO";
                if(isLogin) btnLogin.disabled = false;
            } else {
                btn.textContent = successText;
                btn.style.background = "var(--color-success)";
                setTimeout(() => {
                    if(isLogin || !error) window.location.href = '/';
                }, 1000);
            }
        } catch (err) {
            console.error("Unexpected Auth Error:", err);
            errorMsg.textContent = "ERROR CRÍTICO: " + (err.message || "Desconocido");
             btn.textContent = isLogin ? "INICIAR CONEXIÓN" : "REGISTRAR COMANDO";
             if(isLogin) btnLogin.disabled = false;
        }
    }
}
