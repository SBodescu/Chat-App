import { PubSub } from './pubsub.js';
import { initLoginProcess } from './user-id.js';
import { setupUI } from './ui.js';
import { setupChat } from './chat.js';
import { registerSocketHandlers } from './socket-handlers.js';

document.addEventListener('DOMContentLoaded', async () => {
    const username = await initLoginProcess();
    initializeApp(username);
});

function initializeApp(inputUserId) {
    const socket = io();
    const pubsub = new PubSub();
    const normalizedUserId = inputUserId.toLowerCase().replace(/\s+/g, '_');
    
    const state = {
        userId: normalizedUserId,
        chatUsers: {
            'maria': { name: 'Maria', status: '<Online>', messages: [] },
            'andrei': { name: 'Andrei', status: '<Busy>', messages: [] }
        },
        activeChat: null,
        activeRoom: null,
        chatLoadedOnce: false
    };

    pubsub.publish('app:init', { userId: normalizedUserId });

    setupUI(pubsub, state);
    setupChat(pubsub, state, socket);
    registerSocketHandlers(pubsub, socket, state);

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => pubsub.publish('message:send', {}));

    const msgInput = document.getElementById('message-input');
    if (msgInput) {
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                pubsub.publish('message:send', {});
            }
        });
    }

    const buzzBtn = document.getElementById('buzz-btn');
    if (buzzBtn) buzzBtn.addEventListener('click', () => pubsub.publish('buzz:send', {}));

    const addFriendBtn = document.getElementById('add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', () => {
            const newName = prompt("ID-ul prietenului:");
            if (newName) {
                const id = newName.toLowerCase().replace(/\s+/g, '_');
                pubsub.publish('user:add', { id, name: newName });
            }
        });
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            pubsub.publish('chat:close', {});
        });
    }

    pubsub.publish('ui:render', {});
}