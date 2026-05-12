const nodemailer = require('nodemailer');

// Mock or real transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER || 'placeholder',
    pass: process.env.EMAIL_PASS || 'placeholder'
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: '"MiProfesional" <miprofesiona.app@gmail.com>',
      to,
      subject,
      text,
      html
    });
    console.log('📧 Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('📧 Error sending email:', error);
    // In dev, we don't want to crash if email fails
    return null;
  }
};

const sendWelcomeEmail = (user) => {
  return sendEmail({
    to: user.email,
    subject: '¡Bienvenido a MiProfesional!',
    html: `<h1>Hola ${user.name}</h1><p>Gracias por registrarte en nuestra plataforma.</p>`
  });
};

const sendActivationEmail = (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Tu cuenta profesional ha sido activada',
    html: `<h1>¡Felicidades ${user.name}!</h1><p>Tu cuenta ha sido verificada y ya es visible para los clientes.</p>`
  });
};

const sendExpirationAlert = (user, daysLeft) => {
  return sendEmail({
    to: user.email,
    subject: `Tu suscripción vence en ${daysLeft} días`,
    html: `<p>Hola, tu suscripción a MiProfesional vencerá pronto. Renueva ahora para no perder visibilidad.</p>`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendActivationEmail,
  sendExpirationAlert
};
