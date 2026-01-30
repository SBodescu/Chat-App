import { addMessageUI } from './ui.js';

export function openChat(id, userId, chatUsers, socket, renderUsersFn, displayMessagesFn) {
    const mainBody = document.querySelector('.main-body');
    if (mainBody) mainBody.classList.add('mobile-chat-active');
    
    window.activeChat = id;
    const user = chatUsers[id];

    document.getElementById('current-chat-name').innerText = user.name;
    document.getElementById('current-chat-status').innerText = user.status;

    window.activeRoom = [userId, id].sort().join('_');
    socket.emit('join_room', window.activeRoom);

    renderUsersFn();
    displayMessagesFn();
}

export function sendMessage(userId, socket, chatUsers, activeChat, activeRoom, addMessageUIFn) {
    if (!activeChat) {
        alert("Selecteaza un prieten!");
        return;
    }

    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        chatUsers[activeChat].messages.push({
            sender: 'me', text: text, time: time
        });
        addMessageUIFn(text, 'me', time, false);

        socket.emit('send_message', {
            room: activeRoom,
            senderId: userId, 
            text: text,
            time: time
        });

        input.value = '';
        
        const display = document.getElementById('messages-display');
        display.scrollTop = display.scrollHeight;
    }
}

export function sendBuzz(userId, socket, chatUsers, activeChat, activeRoom, addMessageUIFn) {
    if (!activeChat) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    socket.emit('send_buzz', { 
        room: activeRoom,
        senderId: userId,
        time: time
    });
    
    chatUsers[activeChat].messages.push({
        sender: 'system', text: '!!! BUZZ !!!', time: time, isBuzz: true
    });
    
    addMessageUIFn("!!! BUZZ !!!", 'system', time, true);
    animateBuzz();
    playSound('sounds/messenger_buzz.mp3');
}

export function animateBuzz() {
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) {
        chatArea.style.transform = "translateX(5px)";
        setTimeout(() => chatArea.style.transform = "translateX(-5px)", 50);
        setTimeout(() => chatArea.style.transform = "translateX(0)", 150);
    }
}

export function playSound(file) {
    const audio = new Audio(file);
    audio.play().catch(e => {});
}

export function autoOpenFirstChat(chatUsers, openChatFn) {
    if (window.chatLoadedOnce) return;
    
    const userIds = Object.keys(chatUsers);
    
    for (let id of userIds) {
        if (chatUsers[id].messages && chatUsers[id].messages.length > 0) {
            const hasNonBuzzMessages = chatUsers[id].messages.some(msg => !msg.isBuzz);
            if (hasNonBuzzMessages) {
                openChatFn(id);
                window.chatLoadedOnce = true;
                return;
            }
        }
    }
    
    if (userIds.length > 0) {
        openChatFn(userIds[0]);
        window.chatLoadedOnce = true;
    }
}
