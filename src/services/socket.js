import { io } from 'socket.io-client';
const server = 'http://54.88.86.90:8080';
const socket = io(server); 

export default socket;