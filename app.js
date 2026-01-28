const defaultData = {};
let chatData = JSON.parse(localStorage.getItem('ym_full_db')) || defaultData;
let activeChatId = null;

function renderFriendsList() {
    const container = document.getElementById('friends-list-container');
    const countLabel = document.getElementById('friends-count');
    
    container.innerHTML = '';
    
    const userIds = Object.keys(chatData);
    countLabel.innerText = `▼ Friends (${userIds.length})`;

    userIds.forEach(id => {
        const user = chatData[id];
        const isActive = id === activeChatId ? 'active' : '';
        
        const div = document.createElement('div');
        div.className = `contact-item ${isActive}`;
        div.onclick = () => loadChat(id);

        const iconClass = user.status.includes('Busy') ? 'busy' : 'online';

        div.innerHTML = `
            <span class="status-icon ${iconClass}">☺</span>
            <div class="contact-details">
                <span class="contact-name">${user.name}</span>
                <span class="status-msg">${user.messages.length > 0 ? 'Chat history available' : 'No messages'}</span>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function loadChat(id) {
    activeChatId = id;
    const user = chatData[id];
    
    document.getElementById('current-chat-name').innerText = user.name;
    document.getElementById('current-chat-status').innerText = user.status;

    renderFriendsList();

    const display = document.getElementById('messages-display');
    display.innerHTML = '';

    user.messages.forEach(msg => {
        appendMessageToUI(msg.text, msg.sender, msg.time);
    });

    display.scrollTop = display.scrollHeight;
}

document.getElementById('add-friend-btn').addEventListener('click', () => {
    const newName = prompt("Enter Friend's Yahoo ID / Name:");
    
    if (newName && newName.trim() !== "") {
        const newId = newName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-3);
        
        chatData[newId] = {
            name: newName,
            status: '<Offline>',
            messages: [] 
        };

        saveData();       
        renderFriendsList(); 
        loadChat(newId);     
    }
});

document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

function sendMessage() {
    if (!activeChatId) {
        alert("Select a friend first!");
        return;
    }

    const input = document.getElementById('message-input');
    const text = input.value.trim();
    const senderType = document.querySelector('input[name="sender-switch"]:checked').value; 

    if (text) {
        appendMessageToUI(text, senderType, 'Now');

        chatData[activeChatId].messages.push({
            sender: senderType,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        saveData();
        input.value = '';
        
        const display = document.getElementById('messages-display');
        display.scrollTop = display.scrollHeight;
    }
}
function appendMessageToUI(text, type, time) {
    const display = document.getElementById('messages-display');
    const div = document.createElement('div');
    div.className = 'ym-msg';

    if (type === 'me') {
        div.classList.add('msg-me');
        div.innerHTML = `<span style="font-weight:bold; color:black;">Eu(${time}):</span> ${text}`;
    } else if (type === 'them') {
        div.classList.add('msg-them');
        const friendName = chatData[activeChatId].name;
        div.innerHTML = `<span style="font-weight:bold; color:blue;">${friendName}(${time}):</span> ${text}`;
    } else if (type === 'system') {
        div.classList.add('system');
        div.innerHTML = text;
    }

    display.appendChild(div);
}

function saveData() {
    localStorage.setItem('ym_full_db', JSON.stringify(chatData));
}

function playBuzzSound() {
    const audio = new Audio('sounds/messenger_buzz.mp3'); 
    audio.play();
}
document.getElementById('buzz-btn').addEventListener('click', () => {
    if (!activeChatId) return;
    
    playBuzzSound();

    const buzzText = "!!! BUZZ !!!";
    appendMessageToUI(buzzText, 'system');
    
    chatData[activeChatId].messages.push({
        sender: 'system', text: buzzText, time: 'Now'
    });
    saveData();
    
    const chatArea = document.querySelector('.chat-area');
    chatArea.style.transform = "translateX(5px)";
    setTimeout(() => chatArea.style.transform = "translateX(-5px)", 50);
    setTimeout(() => chatArea.style.transform = "translateX(5px)", 100);
    setTimeout(() => chatArea.style.transform = "translateX(0)", 150);
});

window.onload = () => {
    renderFriendsList();
    const firstId = Object.keys(chatData)[0];
    if (firstId) loadChat(firstId);
};