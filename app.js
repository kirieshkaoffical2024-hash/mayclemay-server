const io = require('socket.io-client');

// ВАЖНО: Замените этот URL на адрес вашего облачного сервера
// Варианты деплоя: Render.com, Railway.app, Heroku, DigitalOcean
const SERVER_URL = 'https://your-server-url.com'; // Замените на реальный URL
// Для локального тестирования используйте: 'http://localhost:3000'

const socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
});

let currentUser = null;
let contacts = [];
let messages = {};
let activeChat = null;
let typingTimeout = null;

const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭'];

socket.on('connect', () => {
    console.log('✅ Подключено к серверу MaycleMay');
    const statusDiv = document.getElementById('connectionStatus');
    if (statusDiv) {
        statusDiv.textContent = '🟢 Подключено';
        statusDiv.style.color = '#4caf50';
    }
});

socket.on('disconnect', () => {
    console.log('❌ Отключено от сервера');
    const statusDiv = document.getElementById('connectionStatus');
    if (statusDiv) {
        statusDiv.textContent = '🔴 Нет связи';
        statusDiv.style.color = '#f44336';
    }
});

socket.on('connect_error', (error) => {
    console.error('Ошибка подключения:', error);
    const statusDiv = document.getElementById('connectionStatus');
    if (statusDiv) {
        statusDiv.textContent = '⚠️ Ошибка подключения';
        statusDiv.style.color = '#ff9800';
    }
});

socket.on('search-results', (results) => {
    contacts = results;
    renderContacts(contacts);
});

socket.on('all-users', (users) => {
    contacts = users;
    renderContacts(contacts);
});

socket.on('receive-message', (messageData) => {
    const chatUser = messageData.from;
    
    if (!messages[chatUser]) {
        messages[chatUser] = [];
    }
    
    messages[chatUser].push({
        sender: messageData.from,
        text: messageData.text,
        time: messageData.time
    });
    
    if (activeChat && activeChat.username === chatUser) {
        renderMessages();
    }
    
    updateContactLastMessage(chatUser, messageData.text);
    playNotificationSound();
});

socket.on('message-sent', (messageData) => {
    console.log('Сообщение отправлено');
});

socket.on('messages-history', (data) => {
    messages[data.username] = data.messages.map(msg => ({
        sender: msg.from,
        text: msg.text,
        time: msg.time
    }));
    renderMessages();
});

socket.on('user-online', (data) => {
    const contact = contacts.find(c => c.username === data.username);
    if (contact) {
        contact.online = data.online;
        renderContacts(contacts);
    }
});

socket.on('user-typing', (data) => {
    if (activeChat && activeChat.username === data.from) {
        showTypingIndicator(data.typing);
    }
});

document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Profile">`;
        };
        reader.readAsDataURL(file);
    }
});

function login() {
    const nickname = document.getElementById('nickname').value.trim();
    const username = document.getElementById('username').value.trim();
    const photoInput = document.getElementById('photoInput');
    
    if (!nickname || !username) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    if (!username.startsWith('@')) {
        alert('Юзернейм должен начинаться с @');
        return;
    }
    
    let photoData = null;
    if (photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            photoData = event.target.result;
            completeLogin(nickname, username, photoData);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        photoData = generateDefaultAvatar(nickname);
        completeLogin(nickname, username, photoData);
    }
}

function generateDefaultAvatar(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 200, 200);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.charAt(0).toUpperCase(), 100, 100);
    
    return canvas.toDataURL();
}

function completeLogin(nickname, username, photo) {
    currentUser = {
        nickname: nickname,
        username: username,
        photo: photo
    };
    
    socket.emit('register', currentUser);
    
    document.getElementById('userNickname').textContent = nickname;
    document.getElementById('userUsername').textContent = username;
    document.getElementById('userPhoto').src = photo;
    
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    
    socket.emit('get-all-users');
    initEmojiPicker();
}

function updateContactLastMessage(username, text) {
    const contactElement = document.querySelector(`[data-username="${username}"]`);
    if (contactElement) {
        const lastMsg = contactElement.querySelector('.contact-last-message');
        if (lastMsg) {
            lastMsg.textContent = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        }
    }
}

function renderContacts(contactsToRender) {
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';
    
    if (contactsToRender.length === 0) {
        contactsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Пользователи не найдены</div>';
        return;
    }
    
    contactsToRender.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.setAttribute('data-username', contact.username);
        contactItem.onclick = () => openChat(contact);
        
        const onlineIndicator = contact.online ? '<span class="online-indicator"></span>' : '';
        
        contactItem.innerHTML = `
            <div class="contact-avatar-wrapper">
                <img src="${contact.photo}" alt="${contact.nickname}">
                ${onlineIndicator}
            </div>
            <div class="contact-info">
                <div class="contact-nickname">${contact.nickname}</div>
                <div class="contact-username">${contact.username}</div>
                <div class="contact-last-message"></div>
            </div>
        `;
        
        contactsList.appendChild(contactItem);
    });
}

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', function(e) {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length === 0) {
        socket.emit('get-all-users');
        return;
    }
    
    searchTimeout = setTimeout(() => {
        socket.emit('search-users', query);
    }, 300);
});

function openChat(contact) {
    activeChat = contact;
    
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const onlineStatus = contact.online ? '<span class="status-online">● В сети</span>' : '<span class="status-offline">○ Не в сети</span>';
    
    document.getElementById('chatHeader').innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div class="chat-avatar-wrapper">
                <img src="${contact.photo}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
                ${contact.online ? '<span class="online-indicator-large"></span>' : ''}
            </div>
            <div>
                <div style="font-weight: bold; font-size: 16px;">${contact.nickname}</div>
                <div style="font-size: 13px; color: #666;">${contact.username} ${onlineStatus}</div>
            </div>
        </div>
    `;
    
    socket.emit('get-messages', contact.username);
    
    document.getElementById('messageInput').focus();
}

function renderMessages() {
    if (!activeChat) return;
    
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    const chatMessages = messages[activeChat.username] || [];
    
    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender === currentUser.username ? 'own' : ''}`;
        
        const isOwn = msg.sender === currentUser.username;
        const avatar = isOwn ? currentUser.photo : activeChat.photo;
        const senderName = isOwn ? 'Вы' : activeChat.nickname;
        
        messageDiv.innerHTML = `
            <img src="${avatar}" class="message-avatar">
            <div class="message-content">
                <div class="message-sender">${senderName}</div>
                <div class="message-bubble">
                    <div class="message-text">${msg.text}</div>
                </div>
                <div class="message-time">${msg.time}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !activeChat) return;
    
    const message = {
        text: text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    
    socket.emit('send-message', {
        to: activeChat.username,
        message: message
    });
    
    if (!messages[activeChat.username]) {
        messages[activeChat.username] = [];
    }
    
    messages[activeChat.username].push({
        sender: currentUser.username,
        text: message.text,
        time: message.time
    });
    
    input.value = '';
    renderMessages();
    updateContactLastMessage(activeChat.username, message.text);
}

function showTypingIndicator(isTyping) {
    const indicator = document.getElementById('typingIndicator');
    if (isTyping) {
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

let isTyping = false;
document.getElementById('messageInput').addEventListener('input', function() {
    if (!activeChat) return;
    
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', { to: activeChat.username, typing: true });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('typing', { to: activeChat.username, typing: false });
    }, 1000);
});

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function initEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.onclick = () => insertEmoji(emoji);
        picker.appendChild(span);
    });
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.toggle('active');
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
}

document.addEventListener('click', function(e) {
    const picker = document.getElementById('emojiPicker');
    const emojiBtn = document.querySelector('.emoji-btn');
    
    if (!picker.contains(e.target) && e.target !== emojiBtn) {
        picker.classList.remove('active');
    }
});
