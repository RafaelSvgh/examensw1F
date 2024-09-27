import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./Login.css";
import socket from "../services/socket";


function LoginDiv() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Listener para la creación de una sala
    socket.on("sala-creada", (roomCode) => {
      console.log("Sala creada con código:", roomCode);
      setRoomCode(roomCode);
      navigate(`/room/${roomCode}`);
    });

    // Listener para el intento de unirse a una sala
    socket.on("ingresar-a-sala", (success) => {
      if (success) {
        console.log("Ingreso exitoso a la sala:", roomCode);
        navigate(`/room/${roomCode}`);
      } else {
        alert("Código de sala incorrecto.");
      }
    });

    // Limpiar los listeners cuando el componente se desmonta para evitar duplicados
    return () => {
      socket.off("sala-creada");
      socket.off("ingresar-a-sala");
    };
  }, [roomCode, navigate]);

  const handleCreateRoom = () => {
    socket.emit("crear-sala");
  };

  const handleJoinRoom = () => {
    const codigo = prompt("Ingrese el código de la sala:");
    if (codigo) {
      setRoomCode(codigo);
      socket.emit("unirse-a-sala", codigo);
    }
  };

  return (
    <div className="login-div">
      <div className="div-google">
        <button className="btn-google">Iniciar Sesión</button>
      </div>
      <div className="div-ingreso">
        <button className="btn" onClick={handleCreateRoom}>Crear Sala</button>
        <button className="btn" onClick={handleJoinRoom}>Unirme</button>
      </div>
    </div>
  );
}

export default LoginDiv;
