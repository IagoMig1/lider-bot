const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Server } = require('socket.io');
const http = require('http');
const messageHandler = require('./handlers/messageHandler');

// Inicializa o aplicativo express
const app = express();

// Cria o servidor HTTP e o Socket.IO
const server = http.createServer(app);
const io = new Server(server);

let savedQR = null;
let isReady = false;
let isReconnecting = false;

// Inicializa o cliente do WhatsApp com autenticação local
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox'] },
});

// Serve os arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Evento quando o QR Code é gerado
client.on('qr', qr => {
  if (!isReady) {
    savedQR = qr;
    io.emit('qr', qr); // Envia o QR Code via socket para o painel
    console.log('[ QR Code gerado ]');
  }
});

// Evento quando o bot está pronto
client.on('ready', () => {
  isReady = true;
  isReconnecting = false; // Reseta o status de reconexão
  io.emit('ready'); // Emite evento indicando que o bot está pronto
  console.log('[ Bot pronto e conectado ]');
});

// Evento de desconexão do bot
client.on('disconnected', (reason) => {
  console.log('[ Bot desconectado ]', reason);
  isReady = false;
  savedQR = null; // Redefine savedQR para gerar um novo QR Code na próxima conexão

  if (!isReconnecting) {
    isReconnecting = true;
    console.log('[ Tentando reconectar o bot...]');
    setTimeout(() => {
      client.initialize(); // Reinicializa o bot para gerar o QR Code novamente
    }, 3000); // Adiciona um delay de 3 segundos antes de tentar reconectar
  }
});

// Evento quando uma mensagem é recebida
client.on('message', async msg => {
  await messageHandler(client, msg); // Passa a mensagem para o handler de mensagens
});

// Conexão do Socket.IO
io.on('connection', socket => {
  console.log('[ Novo cliente conectado ao painel ]');

  if (savedQR && !isReady) {
    socket.emit('qr', savedQR); // Envia o QR Code para o cliente conectado
  }

  if (isReady) {
    socket.emit('ready'); // Informa que o bot está pronto
  }
});

// Inicializa o cliente do WhatsApp
client.initialize();

// Usa a variável de ambiente PORT, com fallback para 3000
const PORT = process.env.PORT || 3000;

// Inicia o servidor na porta definida
server.listen(PORT, () => {
  console.log(`🌐 Painel disponível em: http://localhost:${PORT}`);
});
