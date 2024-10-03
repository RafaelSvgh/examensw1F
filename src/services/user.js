const API_URL = `https://examensw1b-production.up.railway.app/api/`;

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
