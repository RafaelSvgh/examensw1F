const API_URL = `https://examensw1b-production.up.railway.app/api/`;

export const obtenerDiagramas = async (userId, token) => {
  const response = await fetch(`${API_URL}sala/admin/${userId}`, {
    method: "GET",
    headers: {
      "x-token": token,
    },
  });
  if (!response.ok) {
    throw new Error("Error al obtener los diagramas");
  }

  const data = await response.json();
  return data.salas;
};

export const buscarSala = async (id, token) => {
  const response = await fetch(`${API_URL}sala/buscar/${id}`, {
    method: "GET",
    headers: {
      "x-token": token,
    },
  });
  if (!response.ok) {
    throw new Error("Error al obtener los diagramas");
  }

  const data = await response.json();
  return data.sala;
};

export const crearSala = async (token, nombre) => {
  const response = await fetch(`${API_URL}sala/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Asegurarse de que el tipo de contenido sea JSON
      "x-token": token,
    },
    body: JSON.stringify({ nombre: nombre }), // Convertir el cuerpo a JSON
  });

  if (!response.ok) {
    throw new Error("Error al crear la sala");
  }

  const data = await response.json();
  return data.sala;
};

export const agregarColaborador = async (token, idDiag, id) => {
  const response = await fetch(`${API_URL}sala/agregar-colaborador`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Asegurarse de que el tipo de contenido sea JSON
      "x-token": token,
    },
    body: JSON.stringify({ diagramaId: idDiag, colaboradorId: id }), // Convertir el cuerpo a JSON
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


