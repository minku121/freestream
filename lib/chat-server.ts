import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

interface User {
  ws: WebSocket;
  username: string;
}

interface ChatMessage {
  type: 'message' | 'system' | 'userList';
  user: string;
  content: string;
  timestamp: number;
  users?: string[];
}

const activeUsers = new Map<string, User>();

wss.on('connection', (ws) => {
  let username = '';

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'setUsername') {
        if (activeUsers.has(message.username)) {
          ws.send(
            JSON.stringify({
              type: 'system',
              user: 'System',
              content: 'Username already taken',
              timestamp: Date.now(),
            })
          );
          return;
        }

        username = message.username.trim();
        activeUsers.set(username, { ws, username });

        broadcastSystemMessage(`${username} joined the chat`);
        broadcastUserList();
        return;
      }

      if (message.type === 'message' && username) {
        const chatMessage: ChatMessage = {
          type: 'message',
          user: username,
          content: message.content,
          timestamp: Date.now(),
        };
        broadcast(chatMessage);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (username) {
      activeUsers.delete(username);
      broadcastSystemMessage(`${username} left the chat`);
      broadcastUserList();
    }
  });

  function broadcast(message: ChatMessage) {
    activeUsers.forEach((user) => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(message));
      }
    });
  }

  function broadcastSystemMessage(content: string) {
    const systemMessage: ChatMessage = {
      type: 'system',
      user: 'System',
      content,
      timestamp: Date.now(),
    };
    broadcast(systemMessage);
  }

  function broadcastUserList() {
    const userListMessage: ChatMessage = {
      type: 'userList',
      user: 'System',
      content: 'Active users updated',
      timestamp: Date.now(),
      users: Array.from(activeUsers.keys()),
    };
    broadcast(userListMessage);
  }
});

console.log('WebSocket chat server running on ws://localhost:3001');
