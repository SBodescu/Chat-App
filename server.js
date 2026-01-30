const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { text } = require('stream/consumers');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const messagesFile = path.join(__dirname, 'messages.json');
let messages = {};

function loadMessages() {
    try {
        if (fs.existsSync(messagesFile)) {
            messages = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
        }
    } catch (e) {
        console.log('Eroare la citire messages.json:', e.message);
        messages = {};
    }
}

function saveMessages() {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

function saveMessageToRoom(room, senderId, text, time) {
    if (!messages[room]) {
        messages[room] = [];
    }
    messages[room].push({ senderId, text, time });
    saveMessages();
}

function saveBuzzToRoom(room, senderId, time) {
    if (!messages[room]) {
        messages[room] = [];
    }
    messages[room].push({ senderId, text: '!!! BUZZ !!!', time, isBuzz: true });
    saveMessages();
}

loadMessages();

io.on('connection', (socket) => {
    console.log('Utilizator conectat:', socket.id);
    socket.emit('load_all_messages', messages);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} a intrat în: ${room}`);
        if (messages[room]) {
            socket.emit('load_messages', messages[room]);
        }
    });

    socket.on('send_message', (data) => {
        saveMessageToRoom(data.room, data.senderId, data.text, data.time);
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('send_buzz', (data) => {
        saveBuzzToRoom(data.room, data.senderId, data.time);
        io.to(data.room).emit('receive_buzz', data);
    });

    socket.on('disconnect', () => {
        console.log('User deconectat:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server rulează la http://localhost:${PORT}`);
});