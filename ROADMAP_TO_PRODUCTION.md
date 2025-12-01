# 🚀 Roadmap: De Prototipo a Producción (LEVITA OS)

Actualmente, la aplicación funciona con **datos simulados (Mock Data)** y servicios frontend. Para lanzarla al público y monetizarla, necesitamos construir la infraestructura real ("Backend").

Aquí tienes los pasos críticos para llevar LEVITA a producción:

---

## 1. Infraestructura de Backend (El Cerebro)
Necesitamos una base de datos real y un sistema de autenticación seguro.
*   **Recomendación:** **Supabase** (es la mejor opción para este tipo de apps).
    *   **Base de Datos:** PostgreSQL.
    *   **Auth:** Manejo de usuarios, roles y PINs.
    *   **Realtime:** Para que el "Estado del Culto" se actualice en vivo sin recargar.
*   **Acción:** Crear proyecto en Supabase y migrar los tipos de TypeScript a tablas SQL.

## 2. Seguridad & Multi-tenencia (El Escudo)
Es vital que los datos de una iglesia **NUNCA** sean visibles por otra.
*   **Row Level Security (RLS):** Configurar reglas en la base de datos para que cada consulta incluya automáticamente `WHERE tenant_id = 'mi_iglesia'`.
*   **Super Admin:** Crear un rol especial que pueda ver todo (para tu panel de administración).

## 3. Integración de Servicios Reales (Los Músculos)
Reemplazar los servicios "mock" por APIs reales.
*   **Emails:** Integrar **Resend** o **SendGrid** para enviar los correos de bienvenida y notificaciones.
*   **Archivos:** Usar **Supabase Storage** o **AWS S3** para subir los PDFs y MP3s del planificador.
*   **IA:** Mover la llamada a Gemini a una "Edge Function" (servidor) para proteger tu API Key y no exponerla en el frontend.

## 4. Monetización (La Billetera)
Para cobrar por los planes (Basic, Gold, Platinum).
*   **Stripe:** Integrar Stripe Checkout.
*   **Lógica:** Cuando un pastor paga, el sistema actualiza automáticamente su `tier` en la base de datos y desbloquea las funciones (IA, Traducción, etc.).

## 5. Despliegue (El Lanzamiento)
Poner la app en internet.
*   **Frontend:** Desplegar en **Vercel** o **Netlify** (tienen excelente soporte para Vite/React).
*   **Dominio:** Comprar `levita.app` (o similar) y configurarlo.
*   **PWA:** Asegurar que el `manifest.json` y los iconos estén listos para que los miembros puedan instalar la app en sus celulares.

---

## 💡 ¿Por dónde empezamos?

Mi recomendación es ir en este orden:
1.  **Fase 1:** Configurar **Supabase** (Tablas y Auth) para reemplazar los datos falsos.
2.  **Fase 2:** Conectar el **Login Real**.
3.  **Fase 3:** Probar la **Multi-tenencia** (crear 2 iglesias y verificar que no se vean entre sí).
