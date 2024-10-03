const API_URL = `https://examensw1b-production.up.railway.app/api/login/`;

export const login = async (email, password) => {
  const loginData = {
    email,
    password,
  };

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  if (!response.ok) {
    throw new Error("Error en el login");
  }

  return response.json();
};

export const register = async (email, username, password) => {
  try {
    const response = await fetch(`${API_URL}crear-usuario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        nombre: username,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Error en el registro');
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    throw new Error(error.message || 'Error en el registro');
  }
};