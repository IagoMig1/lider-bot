const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Server } = require('socket.io');
const http = require('http');
const messageHandler = require('./handlers/messageHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let savedQR = null;
let isReady = false;
let isReconnecting = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox'] }
});

app.use(express.static('public'));

client.on('qr', qr => {
  if (!isReady) {
    savedQR = qr;
    io.emit('qr', qr);
    console.log('[ QR Code gerado ]');
  }
});

client.on('ready', () => {
  isReady = true;
  isReconnecting = false; // Reseta o status de reconexão
  io.emit('ready');
  console.log('[ Bot pronto e conectado ]');
});

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

client.on('message', async msg => {
  await messageHandler(client, msg);
});

io.on('connection', socket => {
  console.log('[ Novo cliente conectado ao painel ]');

  if (savedQR && !isReady) {
    socket.emit('qr', savedQR);
  }

  if (isReady) {
    socket.emit('ready');
  }
});

client.initialize();

server.listen(3000, () => {
  console.log('🌐 Painel disponível em: http://localhost:3000');
});
