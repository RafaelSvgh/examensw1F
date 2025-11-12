import config from "../config";

const API_URL = `${config.api.baseUrl}/`;

export const obtenerDiagramas = async (userId, token) => {
  const response = await fetch(`${API_URL}room/admin/${userId}`, {
    method: "GET",
    headers: {
      "x-token": token,
    },
  });
  if (!response.ok) {
    throw new Error("Error al obtener los diagramas");
  }

  const data = await response.json();
  return data.rooms; // Cambiado de data.salas a data.rooms
};

export const buscarSala = async (id, token) => {
  const response = await fetch(`${API_URL}room/${id}`, {
    method: "GET",
    headers: {
      "x-token": token,
    },
  });
  // console.log("Respuesta de buscarSala:", response.json());
  if (!response.ok) {
    throw new Error("Error al obtener los diagramas");
  }

  const data = await response.json();
  return data;
};

export const crearSala = async (token, nombre, adminId) => {
  const response = await fetch(`${API_URL}room`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Asegurarse de que el tipo de contenido sea JSON
      "x-token": token,
    },
    body: JSON.stringify({ name: nombre, adminId: adminId }), // Convertir el cuerpo a JSON
  });

  if (!response.ok) {
    throw new Error("Error al crear la sala");
  }

  const data = await response.json();
  return data;
};

export const agregarColaborador = async (token, idDiag, id) => {
  const response = await fetch(`${API_URL}room/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Asegurarse de que el tipo de contenido sea JSON
      "x-token": token,
    },
    body: JSON.stringify({ id: idDiag, userId: id }), // Convertir el cuerpo a JSON
  });

  if (!response.ok) {
    throw new Error("Error al crear la sala");
  }

  const data = await response.json();
  return data;
};

export const actualizarSala = async (token, salaId, diagramaJson) => {
  try {
    const response = await fetch(`${API_URL}sala/actualizar/${salaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
      body: JSON.stringify({
        diagrama: JSON.parse(diagramaJson),
      }),
    });
    if (!response.ok) {
      throw new Error("Error al guardar el diagrama");
    }

    const data = await response.json();
    return data.sala;
  } catch (error) {
    console.error("Error en la petición de guardar diagrama:", error);
    throw error;
  }
};

export const downloadZip = async (token, modelo) => {
  try {
    const transformedModel = {
      class: "GraphLinksModel",
      nodeDataArray: modelo.nodeDataArray || [],
      linkDataArray: modelo.linkDataArray || []
    };

    console.log("Modelo original:", modelo);
    console.log("Modelo transformado:", transformedModel);

    const response = await fetch(`${API_URL}room/downloadZip`, {
      method: "POST",
      headers: {
        "x-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transformedModel),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al descargar el archivo ZIP");
    }

    // Obtener el blob del archivo ZIP
    const blob = await response.blob();

    // Crear un URL temporal para el blob
    const url = window.URL.createObjectURL(blob);

    // Crear un elemento <a> temporal para iniciar la descarga
    const a = document.createElement("a");
    a.href = url;
    a.download = "back_examen.zip";
    document.body.appendChild(a);
    a.click();

    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: "Descarga iniciada correctamente" };
  } catch (error) {
    console.error("Error al descargar el ZIP:", error);
    throw error;
  }
};

export const downloadFlutterProject = async (token, modelo) => {
  try {
    const transformedModel = {
      class: "GraphLinksModel",
      nodeDataArray: modelo.nodeDataArray || [],
      linkDataArray: modelo.linkDataArray || []
    };

    console.log("Modelo original:", modelo);
    console.log("Modelo transformado:", transformedModel);

    const response = await fetch(`${API_URL}room/downloadFlutterZip`, {
      method: "POST",
      headers: {
        "x-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transformedModel),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al descargar el archivo ZIP");
    }

    // Obtener el blob del archivo ZIP
    const blob = await response.blob();

    // Crear un URL temporal para el blob
    const url = window.URL.createObjectURL(blob);

    // Crear un elemento <a> temporal para iniciar la descarga
    const a = document.createElement("a");
    a.href = url;
    a.download = "flutter-project.zip";
    document.body.appendChild(a);
    a.click();

    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: "Descarga iniciada correctamente" };
  } catch (error) {
    console.error("Error al descargar el proyecto Flutter:", error);
    throw error;
  }
};

export const updateDiagram = async (token, roomId, diagram) => {
  try {
    const response = await fetch(`${API_URL}room/update-diagram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
      body: JSON.stringify({ 
        roomId: roomId, 
        diagram: diagram 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error en la petición: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al actualizar el diagrama:", error);
    throw error;
  }
};
