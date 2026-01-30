export function setupUI(pubsub, state) {
    const display = document.getElementById('my-username-display');
    const sidebar = document.getElementById('my-sidebar-name');
    if (display) display.innerText = state.userId;
    if (sidebar) sidebar.innerText = state.userId;

    pubsub.subscribe('ui:render', () => renderUsersList(pubsub, state));
    pubsub.subscribe('chat:display', () => displayMessages(pubsub, state));
    pubsub.subscribe('message:add', (data) => addMessageUI(data.text, data.type, data.time, data.isBuzz, pubsub, state));
    pubsub.subscribe('user:add', (data) => handleAddUser(data, pubsub, state));
}

function renderUsersList(pubsub, state) {
    const container = document.getElementById('friends-list-container');
    const count = document.getElementById('friends-count');
    
    if (!container) return;
    container.innerHTML = '';
    
    const userIds = Object.keys(state.chatUsers);
    if (count) count.innerText = `▼ Friends (${userIds.length})`;

    userIds.forEach(id => {
        const user = state.chatUsers[id];
        const active = id === state.activeChat ? 'active' : '';
        const div = document.createElement('div');
        div.className = `contact-item ${active}`;
        div.addEventListener('click', () => pubsub.publish('chat:select', { id }));
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

function displayMessages(pubsub, state) {
    const display = document.getElementById('messages-display');
    if (!display) return;
    
    display.innerHTML = '';
    
    if (state.activeChat && state.chatUsers[state.activeChat]) {
        state.chatUsers[state.activeChat].messages.forEach(msg => {
            const type = msg.sender === 'me' ? 'me' : (msg.sender === 'system' ? 'system' : 'them');
            addMessageUI(msg.text, type, msg.time, msg.isBuzz, pubsub, state);
        });
    }
    display.scrollTop = display.scrollHeight;
}

function addMessageUI(text, type, time, isBuzz, pubsub, state) {
    const display = document.getElementById('messages-display');
    const div = document.createElement('div');
    div.className = 'ym-msg';

    if (type === 'me') {
        div.classList.add('msg-me');
        div.innerHTML = `<span style="font-weight:bold; color:black;">Eu (${time}):</span> ${text}`;
    } else if (type === 'them') {
        div.classList.add('msg-them');
        const name = state.chatUsers[state.activeChat] ? state.chatUsers[state.activeChat].name : 'Friend';
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

function handleAddUser(data, pubsub, state) {
    if (!state.chatUsers[data.id]) {
        state.chatUsers[data.id] = { name: data.name, status: '<Offline>', messages: [] };
        pubsub.publish('ui:render', {});
    }
    pubsub.publish('chat:select', { id: data.id });
}
