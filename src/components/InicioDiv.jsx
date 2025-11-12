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
import {
  FaPlus,
  FaUsers,
  FaSignOutAlt,
  FaUser,
  FaCode,
  FaChartLine,
  FaCalendarAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";
import Loading from "./Loading";
import {
  getUserData,
  getUserId,
  getAuthToken,
  setLocalStorageItem,
  clearAuthData,
} from "../utils/localStorage";

function DivInicio() {
  const navigate = useNavigate();
  const [diagramas, setDiagramas] = useState([]);
  const [error, setError] = useState("");
  const [errorDiagramas, setErrorDiagramas] = useState("");
  const [userData, setUserData] = useState(getUserData());
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [loadingDiagramas, setLoadingDiagramas] = useState(true);

  // Estados para los modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [salaName, setSalaName] = useState("");
  const [salaCode, setSalaCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Obtener datos del usuario al montar el componente
    const userInfo = getUserData();
    setUserData(userInfo);

    const fetchDiagramas = async () => {
      try {
        setLoadingDiagramas(true);
        setErrorDiagramas("");
        const userId = getUserId();
        const token = getAuthToken();
        
        if (!userId || !token) {
          setErrorDiagramas("No se encontró información de sesión. Inicia sesión nuevamente.");
          return;
        }

        const diagramasObtenidos = await obtenerDiagramas(userId, token);
        setDiagramas(diagramasObtenidos || []);
      } catch (error) {
        console.error("Error al cargar diagramas:", error);
        if (error.message.includes("401") || error.message.includes("token")) {
          setErrorDiagramas("Tu sesión ha expirado. Inicia sesión nuevamente.");
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          setErrorDiagramas("Error de conexión. Verifica tu internet e intenta nuevamente.");
        } else {
          setErrorDiagramas("No se pudieron cargar tus diagramas. Intenta recargar la página.");
        }
      } finally {
        setLoadingDiagramas(false);
      }
    };

    fetchDiagramas();
  }, []); // Sin dependencias para que se ejecute solo una vez

  useEffect(() => {
    // Socket listeners en un useEffect separado
    const handleWelcome = (payload) => {
      console.log(payload);
      socket.emit("message", { userId: getUserId() });
    };

    const handleConnect = () => {
      console.log("Socket conectado:", socket.id);
      setSocketConnected(true);
      // Emitir evento de prueba cuando se conecta
      socket.emit("join-main", { userId: getUserId() });
    };

    const handleDisconnect = () => {
      console.log("Socket desconectado");
      setSocketConnected(false);
    };

    // Verificar si el socket ya está conectado al montar el componente
    if (socket.connected) {
      console.log("Socket ya conectado:", socket.id);
      setSocketConnected(true);
      socket.emit("join-main", { userId: getUserId() });
    } else {
      console.log("Socket no conectado, intentando conectar...");
      socket.connect();
    }

    // Agregar listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("welcome", handleWelcome);

    return () => {
      // Limpiar TODOS los listeners del socket
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("welcome", handleWelcome);
      socket.off("sala-creada");
      // socket.off("ingresar-a-sala");
    };
  }, []); // Solo se ejecuta al montar/desmontar

  useEffect(() => {
    // Listener para tecla Escape en un useEffect separado
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading) {
        setShowCreateModal(false);
        setShowJoinModal(false);
        setShowLogoutModal(false);
        setSalaName("");
        setSalaCode("");
        setError("");
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loading]); // Solo depende de loading

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    clearAuthData();
    navigate("/");
  };

  const closeModal = (modalType) => {
    if (loading) return;

    if (modalType === "create") {
      setShowCreateModal(false);
      setSalaName("");
    } else if (modalType === "join") {
      setShowJoinModal(false);
      setSalaCode("");
    } else if (modalType === "logout") {
      setShowLogoutModal(false);
    }
    setError("");
  };

  const crearSalaNueva = async () => {
    if (!salaName.trim()) {
      setError("El nombre de la sala es requerido");
      return;
    }

    setLoading(true);
    const token = getAuthToken();
    const id = getUserId();
    try {
      const sala = await crearSala(token, salaName.trim(), id);
      console.log(sala);
      // const user = await actualizarRol(token, "admin", id);
      await agregarColaborador(token, sala.id, id);
      // setLocalStorageItem("userData", user);
      setLocalStorageItem("sala", sala);
      socket.emit("crear-sala", sala.id);
      navigate(`/room/${sala.id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setShowCreateModal(false);
      setSalaName("");
      setError("");
    }
  };

  const ingresarASala = async () => {
    if (!salaCode.trim()) {
      setError("El código de la sala es requerido");
      return;
    }

    setLoading(true);
    const token = getAuthToken();
    const id = getUserId();
    try {
      await agregarColaborador(token, salaCode.trim(), id);
      const sala = await buscarSala(salaCode.trim(), token);
      // const user = await actualizarRol(token, "colaborador", id);
      // setLocalStorageItem("userData", user);
      setLocalStorageItem("sala", sala);
      socket.emit("unirse-a-sala", salaCode.trim());
      navigate(`/room/${salaCode.trim()}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setShowJoinModal(false);
      setSalaCode("");
      setError("");
    }
  };

  const cargarDiagrama = async (id) => {
    const token = getAuthToken();
    try {
      const sala = await buscarSala(id, token);
      // const user = await actualizarRol(token, "admin", idUser);
      console.log(sala);
      // setLocalStorageItem("userData", user);
      setLocalStorageItem("sala", sala);
      //console.log(JSON.stringify(sala.diagrama));
      socket.emit("cargar-diagrama", { room: sala.id, diagrama: sala.diagram });
      navigate(`/room/${id}`);
    } catch (error) {
      setError(error.message);
      console.log("holaaa");
    }
  };

  return (
    <div className="inicio-div">
      {/* Header con información del usuario */}
      <div className="user-header">
        <div className="user-info">
          <div className="user-avatar">
            <FaUser />
          </div>
          <div className="user-details">
            <h3>¡Bienvenido, {userData?.name || "Usuario"}!</h3>
            <p>{userData?.email}</p>
            <div
              className={`socket-status ${
                socketConnected ? "connected" : "disconnected"
              }`}
            >
              <span className="status-dot"></span>
              {socketConnected ? "Conectado" : "Desconectado"}
            </div>
          </div>
        </div>
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <FaSignOutAlt />
        </button>
      </div>

      <div className="div-botones">
        <button
          className="btn create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus className="btn-icon" />
          <span>Crear Sala</span>
        </button>
        <button className="btn join-btn" onClick={() => setShowJoinModal(true)}>
          <FaUsers className="btn-icon" />
          <span>Unirme</span>
        </button>
      </div>

      <div className="div-titulo">
        <FaChartLine className="title-icon" />
        <h2>Mis diagramas</h2>
        <div className="diagrams-count">
          {Array.isArray(diagramas) ? diagramas.length : 0} diagramas
        </div>
      </div>

      <div className="div-diagramas">
        {(error || errorDiagramas) && (
          <div className="error-container">
            <p>⚠️ {errorDiagramas || error}</p>
            {errorDiagramas && (
              <button 
                className="retry-btn" 
                onClick={() => {
                  setErrorDiagramas("");
                  setLoadingDiagramas(true);
                  const fetchDiagramas = async () => {
                    try {
                      const userId = getUserId();
                      const token = getAuthToken();
                      if (userId && token) {
                        const diagramasObtenidos = await obtenerDiagramas(userId, token);
                        setDiagramas(diagramasObtenidos || []);
                      }
                    } catch (error) {
                      console.error("Error al reintentar cargar diagramas:", error);
                      setErrorDiagramas("Error al cargar diagramas. Intenta recargar la página.");
                    } finally {
                      setLoadingDiagramas(false);
                    }
                  };
                  fetchDiagramas();
                }}
              >
                Reintentar
              </button>
            )}
          </div>
        )}
        {loadingDiagramas ? (
          <div className="loading-diagramas-container">
            <Loading message="Cargando tus diagramas..." />
          </div>
        ) : Array.isArray(diagramas) && diagramas.length > 0 ? (
          diagramas.map((diagrama, index) => (
            <div
              className="diagramas"
              key={diagrama.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="diagram-header">
                <div className="diagram-icon-container">
                  <FaCode className="diagram-icon" />
                </div>
                <div className="diagram-status">
                  <span className="status-indicator active"></span>
                  Activo
                </div>
              </div>
              
              <div className="diagram-content">
                <div className="tit">{diagrama.name || 'Diagrama sin nombre'}</div>
                <div className="diagram-meta">
                  <div className="codigo">
                    <FaCode className="meta-icon" />
                    ID: {diagrama.id}
                  </div>
                  {diagrama.createdAt && (
                    <div className="fecha">
                      <FaCalendarAlt className="meta-icon" />
                      {new Date(diagrama.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                  {diagrama.userCount !== undefined && (
                    <div className="user-count">
                      <FaUsers className="meta-icon" />
                      {diagrama.userCount} colaborador{diagrama.userCount !== 1 ? 'es' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="botones">
                <button
                  onClick={() => cargarDiagrama(diagrama.id)}
                  className="go-btn primary-btn"
                  title="Abrir diagrama"
                >
                  <FaExternalLinkAlt className="btn-icon" />
                  Abrir
                </button>
              </div>
            </div>
          ))
        ) : !loadingDiagramas ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No tienes diagramas creados</h3>
            <p>Usa el botón "Crear Sala" de arriba para comenzar a colaborar</p>
          </div>
        ) : null}
      </div>

      {/* Modal para Crear Sala */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => closeModal("create")}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏗️ Crear Nueva Sala</h3>
              <button
                className="modal-close"
                onClick={() => closeModal("create")}
                disabled={loading}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Ingresa un nombre descriptivo para tu nueva sala de trabajo
                colaborativo
              </p>
              {error && (
                <div className="modal-error">
                  <span>⚠️ {error}</span>
                </div>
              )}
              <div className="input-group">
                <label htmlFor="sala-name">Nombre de la Sala</label>
                <input
                  id="sala-name"
                  type="text"
                  value={salaName}
                  onChange={(e) => {
                    setSalaName(e.target.value);
                    if (error) setError(""); // Limpiar error al escribir
                  }}
                  placeholder="Ej: Proyecto Dashboard 2025"
                  className="modal-input"
                  disabled={loading}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && salaName.trim() && !loading) {
                      crearSalaNueva();
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn secondary"
                onClick={() => closeModal("create")}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="modal-btn primary"
                onClick={crearSalaNueva}
                disabled={loading || !salaName.trim()}
              >
                {loading ? "Creando..." : "Crear Sala"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Unirse a Sala */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => closeModal("join")}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚪 Unirse a Sala</h3>
              <button
                className="modal-close"
                onClick={() => closeModal("join")}
                disabled={loading}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Introduce el código de la sala a la que te quieres unir</p>
              {error && (
                <div className="modal-error">
                  <span>⚠️ {error}</span>
                </div>
              )}
              <div className="input-group">
                <label htmlFor="sala-code">Código de la Sala</label>
                <input
                  id="sala-code"
                  type="text"
                  value={salaCode}
                  onChange={(e) => {
                    setSalaCode(e.target.value);
                    if (error) setError(""); // Limpiar error al escribir
                  }}
                  placeholder="Ej: ABC123"
                  className="modal-input"
                  disabled={loading}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && salaCode.trim() && !loading) {
                      ingresarASala();
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn secondary"
                onClick={() => closeModal("join")}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="modal-btn primary"
                onClick={ingresarASala}
                disabled={loading || !salaCode.trim()}
              >
                {loading ? "Conectando..." : "Unirse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Confirmar Logout */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => closeModal("logout")}>
          <div
            className="modal-content logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>🚪 Cerrar Sesión</h3>
              <button
                className="modal-close"
                onClick={() => closeModal("logout")}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="logout-icon">🔒</div>
              <p>¿Estás seguro de que quieres cerrar sesión?</p>
              <p className="logout-warning">
                Perderás el acceso a tus salas y diagramas hasta que vuelvas a
                iniciar sesión.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn secondary"
                onClick={() => closeModal("logout")}
              >
                Cancelar
              </button>
              <button className="modal-btn danger" onClick={confirmLogout}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DivInicio;
