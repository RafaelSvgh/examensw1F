import { io } from 'socket.io-client';
const server = 'https://examensw1b-production.up.railway.app/';
const socket = io(server); 

export default socket;