# 💾 Nueva Funcionalidad: Guardar Diagrama + Autoguardado

## 📋 Resumen
Se ha actualizado la funcionalidad **"Guardar Diagrama"** para conectar con el backend y se agregó un sistema de **autoguardado opcional** con switch toggle.

## ✨ Funcionalidades Implementadas

### 1. **Guardar Diagrama Manual**

#### **Botón "Guardar Diagrama"**
- **Función**: Guarda el diagrama actual en la base de datos
- **Endpoint**: `POST /room/update-diagram`
- **Comportamiento**:
  - ✅ Obtiene el diagrama actual de GoJS
  - ✅ Envía `roomId` y `diagram` al backend
  - ✅ Muestra alert de éxito/error
  - ✅ **NO hay loading** (como solicitaste)
  - ✅ **NO afecta el diagrama actual** (solo guarda)

#### **Proceso de Guardado**:
```
Click "Guardar Diagrama" 
→ Validar autenticación 
→ Obtener JSON del diagrama 
→ Enviar a /update-diagram 
→ ✅ "¡Guardado! Diagrama guardado correctamente"
```

### 2. **Sistema de Autoguardado**

#### **Switch Toggle Autoguardado**
- **Ubicación**: Panel lateral, debajo de todos los botones
- **Diseño**: Switch moderno con gradiente cyan-morado
- **Estados**: ON/OFF

#### **Lógica del Autoguardado**:
- ⏱️ **Debounce de 2 segundos**: Se activa 2 segundos después del último cambio
- 🔇 **Silencioso**: Sin alerts ni loading
- 📝 **Solo en cambios reales**: No se activa por actualizaciones de socket
- 🚀 **Automático**: Se ejecuta en cualquier modificación del diagrama

#### **Eventos que Activan Autoguardado**:
- Cambio de nombre de clase
- Modificación de atributos
- Cambio de multiplicidades
- Agregar/eliminar nodos
- Agregar/eliminar enlaces
- Mover nodos

### 🛠️ **Implementación Técnica**

#### **Nuevo Servicio** (`src/services/sala.js`)
```javascript
export const updateDiagram = async (token, roomId, diagram) => {
  // Conecta con POST /room/update-diagram
  // Envía { roomId, diagram }
}
```

#### **Función Principal** (`src/pages/room/Room.js`)
```javascript
const handleGuardarDiagrama = async () => {
  // 1. Validar autenticación
  // 2. Obtener diagrama de GoJS
  // 3. Llamar updateDiagram service
  // 4. Mostrar resultado con SweetAlert
}
```

#### **Sistema de Autoguardado**
```javascript
const autoGuardarDiagrama = async () => {
  // Guardado silencioso sin UI
}

const scheduleAutoSave = () => {
  // Debounce de 2 segundos
}
```

### 🎨 **Interfaz de Usuario**

#### **Switch de Autoguardado**
- **Estilo**: Toggle moderno con gradiente
- **Animación**: Transición suave de 0.3s
- **Estados visuales**:
  - **OFF**: Fondo transparente, círculo a la izquierda
  - **ON**: Gradiente cyan-morado, círculo a la derecha
  - **Hover**: Efecto glow cyan

#### **CSS Personalizado**:
```css
.auto-save-container {
  /* Contenedor con fondo semitransparente */
}

.auto-save-checkbox {
  /* Switch personalizado sin appearance nativa */
  /* Transiciones suaves y efectos hover */
}
```

### 🚀 **Casos de Uso**

#### **Guardado Manual**:
```
1. Usuario modifica diagrama
2. Click "Guardar Diagrama"
3. → "¡Guardado! Diagrama guardado correctamente"
```

#### **Autoguardado Habilitado**:
```
1. Usuario activa switch "Autoguardado"
2. Modifica cualquier elemento del diagrama
3. Después de 2 segundos de inactividad:
   → Se guarda automáticamente (sin notificación)
4. En consola: "Autoguardado completado"
```

#### **Autoguardado Deshabilitado**:
```
1. Usuario desactiva switch
2. Modificaciones no se guardan automáticamente
3. Solo se guarda con el botón manual
```

### 📡 **Estructura del Request**

**Endpoint**: `POST /room/update-diagram`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "x-token": "Bearer_token_here"
}
```

**Body**:
```json
{
  "roomId": "room_id_from_params",
  "diagram": {
    "nodeDataArray": [...],
    "linkDataArray": [...]
  }
}
```

**Response del Backend**:
```json
{
  "message": "Diagram updated successfully",
  "room": {
    "id": "room_id",
    "name": "room_name", 
    "diagram": {...},
    "updatedAt": "2025-11-12T...",
    "adminId": "admin_id"
  }
}
```

### ⚡ **Optimizaciones**

1. **Debounce**: Evita múltiples guardados consecutivos
2. **Cleanup**: Limpia timeouts al desmontar componente
3. **Validación**: Solo guarda si hay token y diagrama válido
4. **Silent Mode**: Autoguardado no interrumpe el flujo de trabajo

### 🔧 **Archivos Modificados**
- `src/services/sala.js` - Nuevo endpoint updateDiagram
- `src/pages/room/Room.js` - Nueva lógica de guardado y autoguardado  
- `src/pages/room/Room.css` - Estilos para switch de autoguardado

### 🎯 **Ventajas del Sistema**

1. **Flexibilidad**: Usuario elige manual o automático
2. **Performance**: Debounce evita guardados excesivos
3. **UX**: Autoguardado silencioso no molesta
4. **Confiabilidad**: Validaciones y manejo de errores
5. **Visual**: Switch moderno y intuitivo

---
**Implementado el:** 12 de noviembre de 2025  
**Desarrollado por:** GitHub Copilot  
**Backend requerido**: Endpoint `/room/update-diagram` (ya implementado)