// services/emailService.ts

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// In a real backend, this API Key would be hidden in an Edge Function.
// For this frontend-only demo, we will simulate the call or use a public-facing endpoint if available.
// WARNING: NEVER expose real Resend API Keys in client-side code in production.
const RESEND_API_KEY = 're_123456789'; // Placeholder

export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  console.log(`[EmailService] Sending email to ${payload.to}...`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // In a real Next.js app, we would fetch('/api/send-email', ...)
  // Here we just log the success to simulate the integration.

  console.log(`[EmailService] Email Sent Successfully!`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Content: ${payload.html.substring(0, 50)}...`);

  return true;
};

export const sendWelcomeEmail = async (email: string, name: string, tempPass: string) => {
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Bienvenido a Levita, ${name}!</h1>
      <p>Se ha creado tu cuenta exitosamente.</p>
      <p><strong>Tu contraseña temporal es:</strong> ${tempPass}</p>
      <p>Por favor inicia sesión y cámbiala inmediatamente.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Bienvenido a Levita Church OS',
    html
  });
};

export const sendRosterNotification = async (email: string, name: string, date: string, role: string) => {
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Hola ${name}, tienes un nuevo turno.</h1>
      <p>Has sido programado para servir el <strong>${date}</strong>.</p>
      <p><strong>Rol:</strong> ${role}</p>
      <p>Confirma tu asistencia en la aplicación.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Nuevo Turno Asignado - Levita',
    html
  });
};

export const sendNewTenantEmail = async (email: string, pastorName: string, churchName: string, tier: string, tempPass: string) => {
  const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h1>¡Bienvenido Pastor ${pastorName}!</h1>
        <p>Su iglesia <strong>${churchName}</strong> ha sido registrada en LEVITA OS con el plan <strong>${tier}</strong>.</p>
        <p>Sus credenciales de acceso son:</p>
        <ul>
            <li><strong>Usuario:</strong> ${email}</li>
            <li><strong>Contraseña Temporal:</strong> ${tempPass}</li>
        </ul>
        <p>Por favor ingrese y configure su iglesia.</p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject: 'Bienvenido a Levita - Nueva Iglesia Registrada',
    html
  });
};