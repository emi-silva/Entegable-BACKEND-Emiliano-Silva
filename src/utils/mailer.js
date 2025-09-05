const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendPasswordResetEmail(to, link) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Recuperación de contraseña',
    html: `<p>Haz clic en el siguiente botón para restablecer tu contraseña. El enlace expira en 1 hora.</p>
           <a href="${link}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Restablecer contraseña</a>`
  });
}

module.exports = { sendPasswordResetEmail };
