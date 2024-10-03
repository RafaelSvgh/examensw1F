import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import "./InicioDiv.css";
import {
  agregarColaborador,
  buscarSala,
  crearSala,
  obtenerDiagramas,
} from "../services/sala";
import { actualizarRol } from "../services/user";

function DivInicio() {
  const [roomCode] = useState("");
  const navigate = useNavigate();
  const [diagramas, setDiagramas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDiagramas = async () => {
      const userId = JSON.parse(localStorage.getItem("userData")).id; // Obtener el ID del usuario
      const token = localStorage.getItem("authToken"); // Obtener el token de autenticación
      try {
        const diagramasObtenidos = await obtenerDiagramas(userId, token);
        setDiagramas(diagramasObtenidos); // Almacenar los diagramas en el estado
      } catch (error) {
        setError(error.message); // Manejo de errores
      }
    };

    fetchDiagramas();

    // Limpiar los listeners cuando el componente se desmonta para evitar duplicados
    return () => {
      socket.off("sala-creada");
      socket.off("ingresar-a-sala");
    };
  }, [roomCode, navigate]);

  const crearSalaNueva = async () => {
    const token = localStorage.getItem("authToken");
    const nombre = prompt("Ingrese el nombre de la sala:");
    const id = JSON.parse(localStorage.getItem("userData")).id;
    try {
      const sala = await crearSala(token, nombre);
      const user = await actualizarRol(token, "admin", id);
      await agregarColaborador(token, sala.id, id);
      localStorage.setItem("userData", JSON.stringify(user));
      localStorage.setItem("sala", JSON.stringify(sala));
      socket.emit("crear-sala", sala.id);
      navigate(`/room/${sala.id}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const ingresarASala = async () => {
    const codigo = prompt("Ingrese el código de la sala:");
    if (codigo) {
      const token = localStorage.getItem("authToken");
      const id = JSON.parse(localStorage.getItem("userData")).id;
      try {
        await agregarColaborador(token, codigo, id);
        const sala = await buscarSala(codigo, token);
        const user = await actualizarRol(token, "colaborador", id);
        localStorage.setItem("userData", JSON.stringify(user));
        localStorage.setItem("sala", JSON.stringify(sala));
        socket.emit("unirse-a-sala", codigo);
        navigate(`/room/${codigo}`);
      } catch (error) {
        setError(error.message);
        alert("Error al ingresar a la sala");
      }
    }
  };

  const cargarDiagrama = async (id) => {
    const token = localStorage.getItem("authToken");
    const idUser = JSON.parse(localStorage.getItem("userData")).id;
    try {
      const sala = await buscarSala(id, token);
      const user = await actualizarRol(token, "admin", idUser);
      console.log(user);
      localStorage.setItem("userData", JSON.stringify(user));
      localStorage.setItem("sala", JSON.stringify(sala));
      const salaJson = JSON.stringify(sala.diagrama);
      //console.log(JSON.stringify(sala.diagrama));
      socket.emit("cargar-diagrama", { room: sala.id, diagrama: salaJson });
      navigate(`/room/${id}`);
    } catch (error) {
      setError(error.message);
      console.log("holaaa");  
    }
  };

  return (
    <div className="inicio-div">
      <div className="div-botones">
        <button className="btn" onClick={() => crearSalaNueva()}>
          Crear Sala
        </button>
        <button className="btn" onClick={() => ingresarASala()}>
          Unirme
        </button>
      </div>
      <div className="div-titulo">
        <h2>Mis diagramas:</h2>
      </div>
      <div className="div-diagramas">
        {error && <p style={{ color: "red" }}></p>}
        {Array.isArray(diagramas) && diagramas.length > 0 ? (
          diagramas.map((diagrama) => (
            <div className="diagramas" key={diagrama.id}>
              <div className="tit">{diagrama.nombre}</div>
              <div className="codigo">{diagrama.id}</div>
              <div className="botones">
                <button onClick={() => cargarDiagrama(diagrama.id)}>Ir</button>
              </div>
            </div>
          ))
        ) : (
          <p>No tienes diagramas creados.</p>
        )}
      </div>
    </div>
  );
}

export default DivInicio;
