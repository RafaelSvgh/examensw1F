const API_URL = `${process.env.REACT_APP_SERVER_URL}api/`;

export const actualizarRol = async (token, rol, id) => {
  const response = await fetch(`${API_URL}usuario/actualizar-rol`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-token": token,
    },
    body: JSON.stringify({ usuarioId: id, nuevoRol:rol  }), 
  });

  if (!response.ok) {
    throw new Error("Error al actualizar el rol");
  }

  const data = await response.json();
  return data.usuario;
};
