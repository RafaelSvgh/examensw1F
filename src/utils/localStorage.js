/**
 * Utilidades para el manejo seguro de localStorage
 */

/**
 * Obtiene un valor del localStorage y lo parsea de forma segura
 * @param {string} key - Clave del localStorage
 * @param {any} defaultValue - Valor por defecto si no existe o hay error
 * @returns {any} - Valor parseado o valor por defecto
 */
export const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error parsing localStorage item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Guarda un valor en localStorage de forma segura
 * @param {string} key - Clave del localStorage
 * @param {any} value - Valor a guardar
 * @returns {boolean} - true si se guardó correctamente
 */
export const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage "${key}":`, error);
    return false;
  }
};

/**
 * Elimina un item del localStorage de forma segura
 * @param {string} key - Clave del localStorage
 * @returns {boolean} - true si se eliminó correctamente
 */
export const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage "${key}":`, error);
    return false;
  }
};

/**
 * Obtiene los datos del usuario del localStorage de forma segura
 * @returns {object|null} - Datos del usuario o null
 */
export const getUserData = () => {
  return getLocalStorageItem('userData', null);
};

/**
 * Obtiene el token de autenticación del localStorage
 * @returns {string|null} - Token o null
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Obtiene el ID del usuario del localStorage de forma segura
 * @returns {string|null} - ID del usuario o null
 */
export const getUserId = () => {
  const userData = getUserData();
  return userData?.id || null;
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - true si tiene token y datos de usuario
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  const userData = getUserData();
  return !!(token && userData && userData.id);
};

/**
 * Limpia todos los datos de autenticación del localStorage
 */
export const clearAuthData = () => {
  removeLocalStorageItem('authToken');
  removeLocalStorageItem('userData');
  removeLocalStorageItem('sala');
};
