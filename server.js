const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/chatapp')
    .then(() => console.log('Conectat la MongoDB'))
    .catch(err => console.log('Eroare la conectarea la MongoDB:', err.message));



const messageSchema = new mongoose.Schema({
    senderId: String,
    text: String,
    time: String,
    isBuzz: { type: Boolean, default: false }
});

const convoSchema = new mongoose.Schema({
    roomId: String,
    participants: [String],
    messages: [messageSchema]
});

const Convo = mongoose.model('Convo', convoSchema);

io.on('connection', async (socket) => {
    console.log('Utilizator conectat:', socket.id);
    try {
        const allConvos = await Convo.find({});
        const messagesMap = {};
        
        allConvos.forEach(convo => {
            if (convo.roomId) {
                messagesMap[convo.roomId] = convo.messages;
            }
        });
        
        socket.emit('load_all_messages', messagesMap);
    } catch (e) {
        console.error("Eroare la incarcarea mesajelor:", e);
    }

    socket.on('join_room', async (room) => {
        socket.join(room);
        console.log(`Utilizatorul ${socket.id} a intrat în camera ${room}`);
        try {
            let convo = await Convo.findOne({ roomId: room });
            if (!convo) {
                convo = new Convo({ roomId: room, participants: room.split('_'), messages: [] });
                await convo.save();
            }
            
            socket.emit('load_messages', convo.messages);
        } catch (e) {
            console.error("Eroare la găsirea/crearea conversației:", e);
        }
    });

    socket.on('send_message', async (data) => {
        socket.to(data.room).emit('receive_message', data);
        socket.emit('receive_message', data);  
        try {
            const result = await Convo.findOneAndUpdate(
                { roomId: data.room },
                { 
                    $push: { 
                        messages: { 
                            senderId: data.senderId, 
                            text: data.text, 
                            time: data.time,
                            isBuzz: false
                        } 
                    } 
                },
                { upsert: true, new: true } 
            );
            console.log('Mesaj salvat în baza de date:', result.roomId);
        } catch (e) {
            console.error("Eroare la salvare mesaj:", e);
        }
    });

    socket.on('send_buzz', async (data) => {
        io.to(data.room).emit('receive_buzz', data);
        try {
            const result = await Convo.findOneAndUpdate(
                { roomId: data.room },
                { 
                    $push: { 
                        messages: { 
                            senderId: data.senderId, 
                            text: '!!! BUZZ !!!', 
                            time: data.time,
                            isBuzz: true
                        } 
                    } 
                },
                { upsert: true }
            );
            console.log('Buzz salvat în baza de date:', result.roomId);
        } catch (e) {
            console.error("Eroare la salvare buzz:", e);
        }
    });

    socket.on('disconnect', () => {
        console.log('User deconectat:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server rulează la http://localhost:${PORT}`);
});