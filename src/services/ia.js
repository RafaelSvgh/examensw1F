// Servicio para interactuar con los endpoints de IA
import config from "../config";

const API_URL = `${config.api.baseUrl}/`;

export const askQuestion = async (token, question, diagramJson) => {
    const questionComplete = question + ", " + diagramJson;
  const response = await fetch(`${API_URL}ai/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question: questionComplete }),
  });

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status}`);
  }

  const data = await response.json();
  return data.answer;
};

export const uploadImage = async (token, imageFile, additionalContext = "") => {
  const formData = new FormData();
  formData.append("image", imageFile);
  
  // Campo opcional - solo se envía si tiene valor
  if (additionalContext && additionalContext.trim()) {
    formData.append("additionalContext", additionalContext);
  }

  console.log("FormData antes de enviar:", {
    tieneImage: formData.has("image"),
    tieneContext: formData.has("additionalContext"),
  });

  const response = await fetch(`${API_URL}ai/analyze-image`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO incluir Content-Type, el navegador lo establece automáticamente con boundary
    },
    body: formData,
  });

  if (!response.ok) {
    // Intentar obtener el mensaje de error del backend
    let errorMessage = `Error en la petición: ${response.status}`;
    try {
      const errorData = await response.json();
      console.error("Error del backend:", errorData);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Si no es JSON, usar el status
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const fixMultiplicity = async (token, gojsDiagram) => {
  try {
    const response = await fetch(`${API_URL}ai/fix-multiplicity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ gojsDiagram }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Error en la petición: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en fixMultiplicity:", error);
    throw error;
  }
};

export const validateDiagram = async (token, gojsDiagram) => {
  try {
    const response = await fetch(`${API_URL}ai/validate-diagram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ gojsDiagram }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Error en la petición: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en validateDiagram:", error);
    throw error;
  }
};