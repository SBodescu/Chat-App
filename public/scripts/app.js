import { initLoginProcess } from './user-id.js';
import { setUsername, renderUsersList, displayMessages, addMessageUI } from './ui.js';
import { openChat, sendMessage, sendBuzz, autoOpenFirstChat } from './chat.js';
import { registerSocketHandlers } from './socket-handlers.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const username = await initLoginProcess();
    initializeApp(username);

});

function initializeApp(inputUserId) {
    const socket = io();
    const normalizedUserId = inputUserId.toLowerCase().replace(/\s+/g, '_');
    
    window.chatUsers = {
        'maria': { name: 'Maria', status: '<Online>', messages: [] },
        'andrei': { name: 'Andrei', status: '<Busy>', messages: [] }
    };
    window.activeChat = null;
    window.activeRoom = null;
    window.chatLoadedOnce = false;

    setUsername(normalizedUserId);

    const renderUsersFn = () => renderUsersList(window.chatUsers, window.activeChat, openChatFn);
    const displayMessagesFn = () => displayMessages(window.activeChat, window.chatUsers, addMessageUIFn);
    const addMessageUIFn = (text, type, time, isBuzz) => addMessageUI(text, type, time, isBuzz, window.activeChat, window.chatUsers);
    const openChatFn = (id) => openChat(id, normalizedUserId, window.chatUsers, socket, renderUsersFn, displayMessagesFn);
    const sendMessageFn = () => sendMessage(normalizedUserId, socket, window.chatUsers, window.activeChat, window.activeRoom, addMessageUIFn);
    const sendBuzzFn = () => sendBuzz(normalizedUserId, socket, window.chatUsers, window.activeChat, window.activeRoom, addMessageUIFn);
    const autoOpenFirstChatFn = () => autoOpenFirstChat(window.chatUsers, openChatFn);

    registerSocketHandlers(socket, normalizedUserId, window.chatUsers, renderUsersFn, displayMessagesFn, autoOpenFirstChatFn);

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessageFn);

    const msgInput = document.getElementById('message-input');
    if (msgInput) {
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessageFn(); }
        });
    }

    const buzzBtn = document.getElementById('buzz-btn');
    if (buzzBtn) buzzBtn.addEventListener('click', sendBuzzFn);

    const addFriendBtn = document.getElementById('add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', () => {
            const newName = prompt("ID-ul prietenului:");
            if (newName) {
                const id = newName.toLowerCase().replace(/\s+/g, '_');
                if (!window.chatUsers[id]) {
                    window.chatUsers[id] = { name: newName, status: '<Offline>', messages: [] };
                    renderUsersFn();
                }
                openChatFn(id);
            }
        });
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            document.querySelector('.main-body').classList.remove('mobile-chat-active'); 
            window.activeChat = null;
        });
    }

    renderUsersFn();
}