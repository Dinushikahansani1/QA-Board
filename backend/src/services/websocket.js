const WebSocket = require('ws');

let wss;

function init(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
}

function broadcast(data) {
  if (!wss) {
    console.error('WebSocket server not initialized.');
    return;
  }

  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = {
  init,
  broadcast,
};
