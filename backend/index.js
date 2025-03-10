const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/instagram3-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

// Get chat ID from two user addresses
const getChatId = (addr1, addr2) => {
  return [addr1, addr2].sort().join('-');
};

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`User connected: ${userId}`);
  
  // Add user to connected users
  connectedUsers.set(userId, socket.id);
  
  // Broadcast online users
  io.emit('onlineUsers', Array.from(connectedUsers.keys()));
  
  // Handle private messages
  socket.on('message', async (message) => {
    console.log('Message received:', message);
    
    // Store message in database
    try {
      const chatId = getChatId(message.from, message.to);
      const newMessage = new Message({
        chatId,
        from: message.from,
        to: message.to,
        content: message.content,
        timestamp: message.timestamp
      });
      
      await newMessage.save();
      
      // Send to recipient if online
      const recipientSocketId = connectedUsers.get(message.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message', message);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  // Handle chat history request
  socket.on('getChatHistory', async ({ user1, user2 }) => {
    try {
      const chatId = getChatId(user1, user2);
      const messages = await Message.find({ chatId })
        .sort({ timestamp: 1 })
        .limit(100);
      
      socket.emit('chatHistory', { chatId, messages });
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('chatHistory', { chatId: getChatId(user1, user2), messages: [] });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    
    // Remove user from connected users
    connectedUsers.delete(userId);
    
    // Broadcast updated online users
    io.emit('onlineUsers', Array.from(connectedUsers.keys()));
  });
});

// API routes
app.get('/', (req, res) => {
  res.send('Instagram 3.0 Chat Server is running');
});

app.get('/status', (req, res) => {
  res.json({
    users: Array.from(connectedUsers.keys()),
    connections: connectedUsers.size
  });
});

// Get chat history via REST API
app.get('/api/chat/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const chatId = getChatId(user1, user2);
    
    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});