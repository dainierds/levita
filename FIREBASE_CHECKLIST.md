#  Plan de Implementación: LEVITA en Firebase

Este documento servirá como nuestra lista de control (checklist) para migrar la aplicación a producción usando Google Firebase.

## 🟢 Fase 1: Configuración Inicial (Tú debes hacer esto)
Para conectar la app, necesitas crear el proyecto en la consola de Google.

1.  [x] Ve a **[console.firebase.google.com](https://console.firebase.google.com/)** e inicia sesión.
2.  [x] Crea un nuevo proyecto llamado **"Levita Church OS"**.
3.  [x] **Habilitar Authentication:**
    *   Ve al menú "Compilación" -> "Authentication".
    *   Pestaña "Sign-in method" (Método de inicio de sesión).
    *   Habilita **Correo electrónico/contraseña**.
4.  [x] **Habilitar Firestore Database:**
    *   Ve al menú "Compilación" -> "Firestore Database".
    *   Dale a "Crear base de datos".
    *   Selecciona una ubicación cercana (ej. `us-central1` o `nam5`).
    *   **IMPORTANTE:** Empieza en **modo de producción**.
5.  [x] **Habilitar Storage:**
    *   Ve al menú "Compilación" -> "Storage".
    *   Dale a "Comenzar".
    *   Acepta los valores por defecto.
6.  [x] **Obtener Credenciales:**
    *   Ve a la "Configuración del proyecto" (engranaje ⚙️ arriba a la izquierda).
    *   Baja hasta "Tus apps" y haz clic en el icono web `</>`.
    *   Registra la app (ponle "Levita Web").
    *   **COPIA** el objeto `firebaseConfig` que te mostrará. Lo necesitaremos.

---

## 🟠 Fase 2: Integración en Código (Yo haré esto)
Una vez tengas las credenciales, procederé a:

1.  [x] Instalar el SDK de Firebase (`npm install firebase`).
2.  [x] Configurar las variables de entorno en `.env`.
3.  [x] Crear el archivo de conexión `src/services/firebase.ts`.

---

## 🔵 Fase 3: Migración de Lógica (Trabajo Conjunto)
Reemplazaremos los datos falsos por llamadas reales a la base de datos.

1.  [ ] **Autenticación:** Reemplazar `AuthContext` para usar Firebase Auth.
2.  [ ] **Multi-tenencia (Datos):**
    *   Crear colección `tenants` (Iglesias).
    *   Crear colección `users` (vinculados a un `tenantId`).
3.  [x] **Reglas de Seguridad:** Configurar `firestore.rules` para que una iglesia no vea datos de otra.
4.  [ ] **Eventos y Planes:** Migrar `useEvents` y `usePlans` para leer/escribir en Firestore.
5.  [ ] **Archivos:** Conectar la subida de archivos del Planificador a Firebase Storage.

---

## 🟣 Fase 4: Despliegue
1.  [ ] Configurar Firebase Hosting.
2.  [ ] Subir la aplicación a internet.
