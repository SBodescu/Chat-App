export function setUsername(userId) {
    const display = document.getElementById('my-username-display');
    const sidebar = document.getElementById('my-sidebar-name');
    if (display) display.innerText = userId;
    if (sidebar) sidebar.innerText = userId;
}

export function renderUsersList(chatUsers, activeChat, openChatFn) {
    const container = document.getElementById('friends-list-container');
    const count = document.getElementById('friends-count');
    
    if (!container) return;
    container.innerHTML = '';
    
    const userIds = Object.keys(chatUsers);
    if (count) count.innerText = `▼ Friends (${userIds.length})`;

    userIds.forEach(id => {
        const user = chatUsers[id];
        const active = id === activeChat ? 'active' : '';
        const div = document.createElement('div');
        div.className = `contact-item ${active}`;
        div.addEventListener('click', () => openChatFn(id));
        div.innerHTML = `
            <span class="status-icon online">☺</span>
            <div class="contact-details">
                <span class="contact-name">${user.name}</span>
                <span class="status-msg">Click to chat</span>
            </div>
        `;
        container.appendChild(div);
    });
}

export function displayMessages(activeChat, chatUsers, addMessageUIFn) {
    const display = document.getElementById('messages-display');
    if (!display) return;
    
    display.innerHTML = '';
    
    if (activeChat && chatUsers[activeChat]) {
        chatUsers[activeChat].messages.forEach(msg => {
            addMessageUIFn(msg.text, msg.sender, msg.time, msg.isBuzz);
        });
    }
    display.scrollTop = display.scrollHeight;
}

export function addMessageUI(text, type, time, isBuzz, activeChat, chatUsers) {
    const display = document.getElementById('messages-display');
    const div = document.createElement('div');
    div.className = 'ym-msg';

    if (type === 'me') {
        div.classList.add('msg-me');
        div.innerHTML = `<span style="font-weight:bold; color:black;">Eu (${time}):</span> ${text}`;
    } else if (type === 'them') {
        div.classList.add('msg-them');
        const name = chatUsers[activeChat] ? chatUsers[activeChat].name : 'Friend';
        div.innerHTML = `<span style="font-weight:bold; color:blue;">${name} (${time}):</span> ${text}`;
    } else if (type === 'system' || isBuzz) {
        div.classList.add('system');
        if (isBuzz) {
            div.classList.add('buzz-msg');
        }
        div.innerHTML = text;
    }

    display.appendChild(div);
}
