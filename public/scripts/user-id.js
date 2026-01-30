export function initLoginProcess() {
    return new Promise((resolve) => {
        const loginOverlay = document.getElementById('login-overlay');
        const loginBtn = document.getElementById('login-submit-btn');
        const usernameInput = document.getElementById('login-username');
        const appContainer = document.querySelector('.app-container'); 

        function submitLogin() {
            const rawName = usernameInput.value.trim();

            if (!rawName) {
                alert("Te rog introdu un ID!");
                return;
            }

            loginOverlay.classList.add('hidden');

            appContainer.classList.remove('hidden');
            resolve(rawName);
        }

        if (loginBtn) loginBtn.addEventListener('click', submitLogin);
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitLogin();
            });
            usernameInput.focus();
        }
    });
}