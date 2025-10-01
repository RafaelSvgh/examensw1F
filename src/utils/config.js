/**
 * Utilidades para el manejo de configuración y variables de entorno
 */

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @param {string[]} requiredVars - Array de nombres de variables requeridas
 * @returns {boolean} - true si todas las variables están presentes
 */
export const validateEnvironmentVariables = (requiredVars) => {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.log('📝 Crea un archivo .env basado en .env.example');
    return false;
  }
  
  return true;
};

/**
 * Obtiene una variable de entorno con un valor por defecto
 * @param {string} varName - Nombre de la variable de entorno
 * @param {string} defaultValue - Valor por defecto si la variable no existe
 * @returns {string} - Valor de la variable o el valor por defecto
 */
export const getEnvVar = (varName, defaultValue = '') => {
  const value = process.env[varName];
  
  if (!value && defaultValue) {
    console.warn(`⚠️ Variable de entorno ${varName} no encontrada, usando valor por defecto`);
    return defaultValue;
  }
  
  return value || defaultValue;
};

/**
 * Verifica si estamos en modo desarrollo
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return process.env.REACT_APP_ENV === 'development' || process.env.NODE_ENV === 'development';
};

/**
 * Verifica si estamos en modo producción
 * @returns {boolean}
 */
export const isProduction = () => {
  return process.env.REACT_APP_ENV === 'production' || process.env.NODE_ENV === 'production';
};

/**
 * Log condicional que solo se ejecuta en desarrollo
 * @param {...any} args - Argumentos para console.log
 */
export const devLog = (...args) => {
  if (isDevelopment()) {
    console.log('🔧 [DEV]', ...args);
  }
};

/**
 * Construye URLs de API de forma segura
 * @param {string} baseUrl - URL base
 * @param {string} endpoint - Endpoint a concatenar
 * @returns {string} - URL completa
 */
export const buildApiUrl = (baseUrl, endpoint) => {
  // Remover slash final de baseUrl y slash inicial de endpoint
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  
  return `${cleanBaseUrl}/${cleanEndpoint}`;
};
