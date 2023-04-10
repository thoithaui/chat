const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3030;
const CHAT_HISTORY_FILE = './chatHistory.json';

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Serve static files
app.use(express.static('public'));

// Load chat history from file
let chatHistory = [];
if (fs.existsSync(CHAT_HISTORY_FILE)) {
    chatHistory = JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE));
}

// Save chat history to file
function saveChatHistory() {
    fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(chatHistory), (err) => {
        if (err) throw err;
        console.log('Chat history saved to file');
    });
}

// Lấy tất cả các giá trị của trường "date"
const dateList = chatHistory.map((obj) => obj.date);

// Lấy tất cả các đối tượng có "date" tương ứng với giá trị được chọn
function getMessagesByDate(date) {
    return chatHistory.filter((obj) => obj.date === date);
}

// Socket.io
io.on('connection', (socket) => {
    console.log('New user connected');

    // Send chat history to new client
    socket.emit('chatHistory', chatHistory);
    socket.emit('dateList', dateList);
    // Receive new message
    socket.on('newMessage', (messageData) => {
        console.log(`New message from ${messageData.user}: ${messageData.message}`);
        chatHistory.push(messageData);
        saveChatHistory();
        io.emit('newMessage', messageData);
    });

    // Disconnect user
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
