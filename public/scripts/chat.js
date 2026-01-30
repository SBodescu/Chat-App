export function setupChat(pubsub, state, socket) {
    pubsub.subscribe('chat:select', (data) => openChat(data.id, pubsub, state, socket));
    pubsub.subscribe('message:send', () => sendMessage(pubsub, state, socket));
    pubsub.subscribe('buzz:send', () => sendBuzz(pubsub, state, socket));
    pubsub.subscribe('socket:load_messages', (data) => handleLoadMessages(data, pubsub, state));
    pubsub.subscribe('chat:close', () => closeChat(pubsub, state));
}

function openChat(id, pubsub, state, socket) {
    const mainBody = document.querySelector('.main-body');
    if (mainBody) mainBody.classList.add('mobile-chat-active');
    
    state.activeChat = id;
    const user = state.chatUsers[id];

    document.getElementById('current-chat-name').innerText = user.name;
    document.getElementById('current-chat-status').innerText = user.status;

    state.activeRoom = [state.userId, id].sort().join('_');
    socket.emit('join_room', state.activeRoom);

    pubsub.publish('ui:render', {});
    pubsub.publish('chat:display', {});
}

function closeChat(pubsub, state) {
    document.querySelector('.main-body').classList.remove('mobile-chat-active');
    state.activeChat = null;
    pubsub.publish('ui:render', {});
}

function sendMessage(pubsub, state, socket) {
    if (!state.activeChat) {
        alert("Selecteaza un prieten!");
        return;
    }

    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        state.chatUsers[state.activeChat].messages.push({
            sender: 'me', text: text, time: time
        });

        pubsub.publish('message:add', { text, type: 'me', time, isBuzz: false });

        socket.emit('send_message', {
            room: state.activeRoom,
            senderId: state.userId, 
            text: text,
            time: time
        });

        input.value = '';
        
        const display = document.getElementById('messages-display');
        display.scrollTop = display.scrollHeight;
    }
}

function sendBuzz(pubsub, state, socket) {
    if (!state.activeChat) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    socket.emit('send_buzz', { 
        room: state.activeRoom,
        senderId: state.userId,
        time: time
    });
    
    state.chatUsers[state.activeChat].messages.push({
        sender: 'system', text: '!!! BUZZ !!!', time: time, isBuzz: true
    });
    
    pubsub.publish('message:add', { text: "!!! BUZZ !!!", type: 'system', time, isBuzz: true });
    animateBuzz();
    playSound('sounds/messenger_buzz.mp3');
}

function handleLoadMessages(data, pubsub, state) {
    if (state.activeChat && state.chatUsers[state.activeChat]) {
        state.chatUsers[state.activeChat].messages = [];
        
        data.messages.forEach(msg => {
            const sender = msg.senderId === state.userId ? 'me' : 'them';
            state.chatUsers[state.activeChat].messages.push({
                sender: sender,
                text: msg.text,
                time: msg.time,
                isBuzz: msg.isBuzz
            });
        });
        
        pubsub.publish('chat:display', {});
    }
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

export function autoOpenFirstChat(pubsub, state) {
    if (state.chatLoadedOnce) return;
    
    const userIds = Object.keys(state.chatUsers);
    
    for (let id of userIds) {
        if (state.chatUsers[id].messages && state.chatUsers[id].messages.length > 0) {
            const hasNonBuzzMessages = state.chatUsers[id].messages.some(msg => !msg.isBuzz);
            if (hasNonBuzzMessages) {
                pubsub.publish('chat:select', { id });
                state.chatLoadedOnce = true;
                return;
            }
        }
    }
    
    if (userIds.length > 0) {
        pubsub.publish('chat:select', { id: userIds[0] });
        state.chatLoadedOnce = true;
    }
}
