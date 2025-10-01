import { io } from 'socket.io-client';
import config from '../config';

const server = config.api.socketUrl;
const socket = io(server, {
  autoConnect: true, // Conectar automáticamente
  reconnection: true, // Reconectar automáticamente
  reconnectionDelay: 1000, // Esperar 1 segundo antes de reconectar
  reconnectionAttempts: 5, // Intentar reconectar 5 veces
  timeout: 20000, // Timeout de 20 segundos
});

// Agregar logs para debugging
socket.on('connect', () => {
  console.log('✅ Socket conectado:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket desconectado:', reason);
});

socket.on('connect_error', (error) => {
  console.log('🔴 Error de conexión socket:', error);
});

export default socket;