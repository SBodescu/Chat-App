export function registerSocketHandlers(pubsub, socket, state) {
    socket.on('load_all_messages', (allMessages) => {
        Object.keys(allMessages).forEach(room => {
            const participants = room.split('_');
            if (participants.includes(state.userId)) {
                const otherId = participants.find(p => p !== state.userId);
                
                if (otherId) {
                    if (!state.chatUsers[otherId]) {
                        state.chatUsers[otherId] = { name: otherId, status: '<Online>', messages: [] };
                    }
                    
                    state.chatUsers[otherId].messages = [];
                    
                    allMessages[room].forEach(msg => {
                        const sender = msg.senderId === state.userId ? 'me' : 'them';
                        state.chatUsers[otherId].messages.push({
                            sender: sender,
                            text: msg.text,
                            time: msg.time,
                            isBuzz: msg.isBuzz
                        });
                    });
                }
            }
        });
        
        pubsub.publish('ui:render', {});
        
        import('./chat.js').then(module => {
            module.autoOpenFirstChat(pubsub, state);
        });
    });

    socket.on('load_messages', (serverMessages) => {
        pubsub.publish('socket:load_messages', { messages: serverMessages });
    });

    socket.on('receive_message', (data) => {
        const senderId = data.senderId;
        
        if (state.chatUsers[senderId]) {
            state.chatUsers[senderId].messages.push({
                sender: 'them', text: data.text, time: data.time
            });

            if (state.activeChat === senderId) {
                pubsub.publish('message:add', { text: data.text, type: 'them', time: data.time, isBuzz: false });
                const display = document.getElementById('messages-display');
                display.scrollTop = display.scrollHeight;
            } else {
                pubsub.publish('ui:render', {});
            }
        }
    });

    socket.on('receive_buzz', (data) => {
        const senderId = data.senderId;
        
        if (state.chatUsers[senderId]) {
            state.chatUsers[senderId].messages.push({
                sender: 'system', text: '!!! BUZZ !!!', time: data.time, isBuzz: true
            });

            playSound('sounds/messenger_buzz.mp3');
            if (state.activeChat === senderId) {
                pubsub.publish('message:add', { text: "!!! BUZZ !!!", type: 'system', time: data.time, isBuzz: true });
                
                import('./chat.js').then(module => {
                    module.animateBuzz();
                });
            } else {
                pubsub.publish('ui:render', {});
            }
        }
    });
}

function playSound(file) {
    const audio = new Audio(file);
    audio.play().catch(e => {});
}
