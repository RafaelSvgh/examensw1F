import config from '../config';

const API_URL = `${config.api.authUrl}/`;

export const login = async (email, password) => {
  const loginData = {
    email,
    password,
  };

  const response = await fetch(`${API_URL}login`, {
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
    const response = await fetch(`${API_URL}register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name: username,
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