const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Хранилище данных (в продакшене использовать базу данных)
const users = new Map();
const messages = new Map();
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    socket.on('register', (userData) => {
        // Сохраняем пользователя
        users.set(userData.username, {
            nickname: userData.nickname,
            username: userData.username,
            photo: userData.photo,
            lastSeen: Date.now()
        });
        
        onlineUsers.set(userData.username, socket.id);
        socket.username = userData.username;
        
        // Уведомляем всех о новом онлайн пользователе
        io.emit('user-online', {
            username: userData.username,
            online: true
        });
        
        console.log('Пользователь зарегистрирован:', userData.username);
        console.log('Всего пользователей онлайн:', onlineUsers.size);
    });

    socket.on('search-users', (query) => {
        const results = Array.from(users.values())
            .filter(user => 
                user.username !== socket.username &&
                (user.username.toLowerCase().includes(query.toLowerCase()) ||
                 user.nickname.toLowerCase().includes(query.toLowerCase()))
            )
            .map(user => ({
                nickname: user.nickname,
                username: user.username,
                photo: user.photo,
                online: onlineUsers.has(user.username)
            }));
        
        socket.emit('search-results', results);
    });

    socket.on('get-all-users', () => {
        const allUsers = Array.from(users.values())
            .filter(user => user.username !== socket.username)
            .map(user => ({
                nickname: user.nickname,
                username: user.username,
                photo: user.photo,
                online: onlineUsers.has(user.username)
            }));
        
        socket.emit('all-users', allUsers);
    });

    socket.on('send-message', (data) => {
        const { to, message } = data;
        const from = socket.username;
        
        if (!from) {
            console.log('Ошибка: отправитель не авторизован');
            return;
        }
        
        const chatKey = [from, to].sort().join('-');
        
        if (!messages.has(chatKey)) {
            messages.set(chatKey, []);
        }
        
        const messageData = {
            from,
            to,
            text: message.text,
            time: message.time,
            id: Date.now()
        };
        
        messages.get(chatKey).push(messageData);
        
        // Отправляем получателю
        const recipientSocketId = onlineUsers.get(to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive-message', messageData);
        }
        
        // Подтверждаем отправителю
        socket.emit('message-sent', messageData);
        
        console.log(`Сообщение от ${from} к ${to}: ${message.text}`);
    });

    socket.on('get-messages', (username) => {
        if (!socket.username) return;
        
        const chatKey = [socket.username, username].sort().join('-');
        const chatMessages = messages.get(chatKey) || [];
        socket.emit('messages-history', { username, messages: chatMessages });
    });

    socket.on('typing', (data) => {
        const recipientSocketId = onlineUsers.get(data.to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('user-typing', {
                from: socket.username,
                typing: data.typing
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            onlineUsers.delete(socket.username);
            
            // Обновляем время последнего визита
            const user = users.get(socket.username);
            if (user) {
                user.lastSeen = Date.now();
            }
            
            // Уведомляем всех об оффлайн статусе
            io.emit('user-online', {
                username: socket.username,
                online: false
            });
            
            console.log('Пользователь отключился:', socket.username);
            console.log('Осталось онлайн:', onlineUsers.size);
        }
    });
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        users: users.size,
        onlineUsers: onlineUsers.size,
        messages: Array.from(messages.values()).reduce((sum, arr) => sum + arr.length, 0)
    });
});

server.listen(PORT, () => {
    console.log(`🚀 MaycleMay сервер запущен на порту ${PORT}`);
    console.log(`📡 Готов к подключениям`);
});
