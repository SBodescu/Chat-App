import { addMessageUI } from './ui.js';
import { animateBuzz, playSound } from './chat.js';

export function registerSocketHandlers(socket, userId, chatUsers, renderUsersFn, displayMessagesFn, autoOpenFirstChatFn) {
    socket.on('load_all_messages', (allMessages) => {
        Object.keys(allMessages).forEach(room => {
            const participants = room.split('_');
            if (participants.includes(userId)) {
                const otherId = participants.find(p => p !== userId);
                
                if (otherId) {
                    if (!chatUsers[otherId]) {
                        chatUsers[otherId] = { name: otherId, status: '<Online>', messages: [] };
                    }
                    
                    chatUsers[otherId].messages = [];
                    
                    allMessages[room].forEach(msg => {
                        const sender = msg.senderId === userId ? 'me' : 'them';
                        chatUsers[otherId].messages.push({
                            sender: sender,
                            text: msg.text,
                            time: msg.time,
                            isBuzz: msg.isBuzz
                        });
                    });
                }
            }
        });
        
        renderUsersFn();
        autoOpenFirstChatFn();
    });

    socket.on('load_messages', (serverMessages) => {
        if (window.activeChat && chatUsers[window.activeChat]) {
            chatUsers[window.activeChat].messages = [];
            
            serverMessages.forEach(msg => {
                const sender = msg.senderId === userId ? 'me' : 'them';
                chatUsers[window.activeChat].messages.push({
                    sender: sender,
                    text: msg.text,
                    time: msg.time,
                    isBuzz: msg.isBuzz
                });
            });
            
            displayMessagesFn();
        }
    });

    socket.on('receive_message', (data) => {
        const senderId = data.senderId;
        
        if (chatUsers[senderId]) {
            chatUsers[senderId].messages.push({
                sender: 'them', text: data.text, time: data.time
            });

            if (window.activeChat === senderId) {
                addMessageUI(data.text, 'them', data.time, false, window.activeChat, chatUsers);
                playSound('sounds/messenger_buzz.mp3');
                const display = document.getElementById('messages-display');
                display.scrollTop = display.scrollHeight;
            } else {
                renderUsersFn();
            }
        }
    });

    socket.on('receive_buzz', (data) => {
        const senderId = data.senderId;
        
        if (chatUsers[senderId]) {
            chatUsers[senderId].messages.push({
                sender: 'system', text: '!!! BUZZ !!!', time: data.time, isBuzz: true
            });

            playSound('sounds/messenger_buzz.mp3');
            if (window.activeChat === senderId) {
                addMessageUI("!!! BUZZ !!!", 'system', data.time, true, window.activeChat, chatUsers);
                animateBuzz();
            } else {
                renderUsersFn();
            }
        }
    });
}
