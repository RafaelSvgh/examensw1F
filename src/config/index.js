/**
 * Configuración centralizada de la aplicación
 * Utiliza variables de entorno para diferentes configuraciones
 */

import { validateEnvironmentVariables, getEnvVar, isDevelopment, devLog } from '../utils/config';

// Variables de entorno requeridas
const requiredEnvVars = [
  'REACT_APP_API_URL',
  'REACT_APP_SOCKET_URL'
];

// Validar variables de entorno requeridas
const isValidConfig = validateEnvironmentVariables(requiredEnvVars);

if (!isValidConfig) {
  console.error('💥 Error de configuración: Variables de entorno faltantes');
  console.log('� Consulta el archivo .env.example para ver la configuración requerida');
}

// Configuración de la aplicación
const config = {
  // URLs del servidor
  api: {
    baseUrl: getEnvVar('REACT_APP_API_URL', 'http://localhost:3001/api'),
    authUrl: `${getEnvVar('REACT_APP_API_URL', 'http://localhost:3001/api')}/auth`,
    socketUrl: getEnvVar('REACT_APP_SOCKET_URL', 'http://localhost:3001')
  },
  
  // Información de la aplicación
  app: {
    name: getEnvVar('REACT_APP_NAME', 'ExamenSW1F'),
    version: getEnvVar('REACT_APP_VERSION', '1.0.0'),
    environment: getEnvVar('REACT_APP_ENV', 'development')
  },
  
  // Configuraciones adicionales
  development: {
    isDevelopment: isDevelopment(),
    enableLogs: isDevelopment()
  },
  
  // Estado de validación
  isValid: isValidConfig
};

// Logging para desarrollo
if (config.development.enableLogs) {
  devLog('Configuración de la aplicación cargada:');
  devLog('📡 API URL:', config.api.baseUrl);
  devLog('🔌 Socket URL:', config.api.socketUrl);
  devLog('🏷️ Nombre:', config.app.name);
  devLog('📦 Versión:', config.app.version);
  devLog('🌍 Entorno:', config.app.environment);
  devLog('✅ Configuración válida:', config.isValid);
}

export default config;
