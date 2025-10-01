# 🔧 Configuración de Variables de Entorno

## 📋 Descripción

Este proyecto utiliza variables de entorno para manejar la configuración de manera flexible y segura. Esto permite tener diferentes configuraciones para desarrollo, testing y producción sin cambiar el código.

## 🚀 Configuración Rápida

### 1. Crear archivo de configuración
```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

### 2. Editar variables según tu entorno
```bash
# Edita el archivo .env con tus configuraciones específicas
nano .env
```

## 📝 Variables de Entorno Disponibles

### 🔗 Configuración del Servidor
| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `REACT_APP_API_URL` | URL base del API backend | `http://localhost:3001/api` | ✅ Sí |
| `REACT_APP_SOCKET_URL` | URL del servidor Socket.IO | `http://localhost:3001` | ✅ Sí |

### 📱 Configuración de la Aplicación
| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `REACT_APP_NAME` | Nombre de la aplicación | `ExamenSW1F` | ❌ No |
| `REACT_APP_VERSION` | Versión de la aplicación | `1.0.0` | ❌ No |
| `REACT_APP_ENV` | Entorno de ejecución | `development` | ❌ No |

### ⚙️ Configuración Opcional
| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `PORT` | Puerto del servidor de desarrollo | `3000` | ❌ No |
| `HTTPS` | Habilitar HTTPS en desarrollo | `false` | ❌ No |

## 🌍 Configuración por Entornos

### 🔧 Desarrollo
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_ENV=development
```

### 🧪 Testing
```env
REACT_APP_API_URL=http://localhost:3002/api
REACT_APP_SOCKET_URL=http://localhost:3002
REACT_APP_ENV=testing
```

### 🚀 Producción
```env
REACT_APP_API_URL=https://api.tudominio.com/api
REACT_APP_SOCKET_URL=https://api.tudominio.com
REACT_APP_ENV=production
```

## 📁 Estructura de Archivos

```
src/
├── config/
│   └── index.js          # Configuración centralizada
├── utils/
│   └── config.js         # Utilidades de configuración
├── services/
│   ├── auth.js          # Servicios de autenticación
│   ├── socket.js        # Configuración de Socket.IO
│   ├── sala.js          # Servicios de salas
│   └── user.js          # Servicios de usuario
├── .env                 # Tu configuración (NO subir a Git)
└── .env.example         # Ejemplo de configuración
```

## 🔒 Seguridad

### ✅ Buenas Prácticas
- ✅ El archivo `.env` está en `.gitignore`
- ✅ Variables sensibles usan prefijo `REACT_APP_`
- ✅ Validación de variables requeridas al inicio
- ✅ Valores por defecto para variables opcionales

### ⚠️ IMPORTANTE
- 🚫 **NUNCA** subas el archivo `.env` a Git
- 🔐 **NO** pongas secretos o claves privadas en variables de React
- 📝 **SÍ** documenta nuevas variables en este README

## 🛠️ Uso en el Código

### Importar configuración
```javascript
import config from '../config';

// Usar URLs de API
const response = await fetch(`${config.api.baseUrl}/endpoint`);

// Conectar Socket.IO
const socket = io(config.api.socketUrl);
```

### Validación automática
```javascript
// El sistema valida automáticamente al iniciar
if (!config.isValid) {
  console.error('Configuración inválida');
}
```

## 🐛 Solución de Problemas

### Error: "Variables de entorno faltantes"
1. Verifica que tienes un archivo `.env` en la raíz del proyecto
2. Compara tu `.env` con `.env.example`
3. Asegúrate de que las variables usen el prefijo `REACT_APP_`

### Error: "Cannot connect to API"
1. Verifica que la URL en `REACT_APP_API_URL` sea correcta
2. Asegúrate de que el backend esté ejecutándose
3. Revisa que no haya problemas de CORS

### Error: "Socket connection failed"
1. Verifica la URL en `REACT_APP_SOCKET_URL`
2. Confirma que el servidor Socket.IO esté activo
3. Revisa configuraciones de firewall

## 📚 Recursos Adicionales

- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Socket.IO Configuration](https://socket.io/docs/v4/client-api/)
- [.env Best Practices](https://github.com/motdotla/dotenv#readme)
