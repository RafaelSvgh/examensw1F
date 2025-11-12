# 🔐 Control de Acceso: Solo Admin puede Autoguardar

## 📋 Resumen
Se ha implementado **control de acceso basado en roles** para que solo el **admin de la sala** pueda usar las funcionalidades de guardado (manual y automático), evitando el caos en la base de datos con múltiples usuarios guardando simultáneamente.

## ✅ **Funcionalidades Implementadas**

### **1. Verificación de Admin**
```javascript
const isAdmin = useMemo(() => {
  if (!user || !sala) return false;
  return user.id === sala.adminId;
}, [user, sala]);
```

**Lógica:**
- Compara `userData.id` (del localStorage) con `sala.adminId`
- `useMemo` para optimizar el rendimiento
- Retorna `true` solo si el usuario es admin

### **2. Switch de Autoguardado - Solo Admin**
```jsx
{isAdmin && (
  <div className="auto-save-container">
    <label className="auto-save-label">
      <input type="checkbox" ... />
      <span className="auto-save-text">Autoguardado (Admin)</span>
    </label>
  </div>
)}
```

**Comportamiento:**
- ✅ **Admin**: Ve y puede usar el switch de autoguardado
- ❌ **Usuario normal**: NO ve el switch (completamente oculto)

### **3. Botón Guardar Diagrama - Indicador Visual**
```jsx
<button className="atri" onClick={handleGuardarDiagrama}>
  {isAdmin ? "Guardar Diagrama" : "Guardar Diagrama (Solo Admin)"}
</button>
```

**Comportamiento:**
- ✅ **Admin**: Botón normal "Guardar Diagrama"
- ⚠️ **Usuario normal**: Botón dice "(Solo Admin)" como advertencia

### **4. Validaciones de Seguridad**

#### **En Guardado Manual:**
```javascript
if (!isAdmin) {
  await Swal.fire({
    icon: "warning",
    title: "Acceso Denegado",
    text: "Solo el admin de la sala puede guardar el diagrama"
  });
  return;
}
```

#### **En Autoguardado:**
```javascript
// Solo admin puede usar autoguardado
if (!autoGuardado || !isAdmin) return;
```

#### **En Programación de Autoguardado:**
```javascript  
// Solo admin puede programar autoguardado
if (!autoGuardado || !isAdmin) return;
```

## 🎯 **Experiencia de Usuario**

### **👑 Como Admin de la Sala:**

#### **Funcionalidades Disponibles:**
- ✅ Ve y puede activar/desactivar el switch "Autoguardado (Admin)"
- ✅ Botón "Guardar Diagrama" funciona normalmente
- ✅ Puede usar autoguardado sin restricciones
- ✅ Ve logs: "Autoguardado silencioso (Admin)..." → "Autoguardado completado por admin"

#### **Flujo Típico:**
```
1. Entra a la sala
2. Ve switch "Autoguardado (Admin)" en el panel
3. Lo activa
4. Modifica diagrama → Se guarda automáticamente cada 2 segundos
5. También puede usar "Guardar Diagrama" manualmente
```

### **👤 Como Usuario Normal:**

#### **Funcionalidades Disponibles:**
- ❌ NO ve el switch de autoguardado (está oculto)
- ⚠️ Ve botón "Guardar Diagrama (Solo Admin)" pero no puede usarlo
- ✅ Puede modificar el diagrama normalmente
- ✅ Ve cambios sincronizados en tiempo real

#### **Flujo Típico:**
```
1. Entra a la sala
2. NO ve switch de autoguardado
3. Ve botón "Guardar Diagrama (Solo Admin)" 
4. Si intenta guardar → Alert: "Acceso Denegado"
5. Puede colaborar editando pero no guardar
```

## 🔒 **Niveles de Seguridad**

### **Nivel 1: UI Condicional**
- El switch solo se renderiza si `isAdmin === true`
- Botón cambia texto para indicar restricción

### **Nivel 2: Validación en Funciones**
- `handleGuardarDiagrama()` verifica `isAdmin` antes de proceder
- `autoGuardarDiagrama()` verifica `isAdmin` antes de ejecutar
- `scheduleAutoSave()` verifica `isAdmin` antes de programar

### **Nivel 3: Feedback Visual**
- Alert específico: "Solo el admin de la sala puede guardar el diagrama"
- Logs diferenciados: "Autoguardado completado por admin"

## 📊 **Flujos de Control**

### **Guardado Manual:**
```
Click "Guardar Diagrama" 
→ ¿Es Admin? 
  → NO: Alert "Acceso Denegado" 
  → SÍ: Procede con guardado normal
```

### **Autoguardado:**
```
Modificar diagrama 
→ ¿Autoguardado ON? 
  → NO: No hace nada
  → SÍ: ¿Es Admin? 
    → NO: No hace nada
    → SÍ: Programa guardado en 2 segundos
```

## 🛡️ **Beneficios del Control de Acceso**

### **1. Evita Caos en BD:**
- Solo 1 persona (admin) puede guardar automáticamente
- No hay conflictos de escritura simultánea
- Reduce carga en el servidor

### **2. Roles Claros:**
- **Admin**: Gestiona persistencia del diagrama
- **Usuarios**: Colaboran en tiempo real sin afectar BD

### **3. UX Mejorada:**
- Usuarios normales no ven opciones confusas
- Admin tiene control total sobre el guardado
- Feedback claro cuando se intenta acción no permitida

## 🧪 **Para Probar**

### **Como Admin:**
1. Entrar con usuario admin a una sala
2. Verificar que aparece switch "Autoguardado (Admin)"
3. Activarlo y modificar diagrama
4. Ver logs de autoguardado en consola
5. Botón dice solo "Guardar Diagrama"

### **Como Usuario Normal:**
1. Entrar con usuario NO admin a la misma sala
2. Verificar que NO aparece switch de autoguardado
3. Botón dice "Guardar Diagrama (Solo Admin)"
4. Intentar guardar → Ver alert "Acceso Denegado"

## 🔍 **Verificación de Datos**

### **userData (localStorage):**
```json
{
  "id": "user_id_123",
  "name": "Usuario Nombre",
  "email": "user@email.com"
}
```

### **sala (localStorage):**
```json
{
  "id": "sala_id_456", 
  "name": "Mi Sala",
  "adminId": "user_id_123",
  "diagram": {...}
}
```

### **isAdmin será `true` si:**
```javascript
userData.id === sala.adminId
// "user_id_123" === "user_id_123" → true
```

---
**Implementado el:** 12 de noviembre de 2025  
**Desarrollado por:** GitHub Copilot

## 🎉 **¡Control de acceso implementado correctamente!**
Solo el admin puede guardar, evitando el caos en la BD con múltiples usuarios guardando simultáneamente.