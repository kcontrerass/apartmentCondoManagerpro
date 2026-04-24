/**
 * Brevo SMTP: conexión y envío de prueba.
 *   node scripts/test-smtp.cjs              → solo comprobar login (verify)
 *   node scripts/test-smtp.cjs --send tu@correo.com  → prueba con correo real
 */
require("dotenv").config();
const nodemailer = require("nodemailer");

const user = (process.env.SMTP_USER || "").trim();
const pass = (process.env.SMTP_PASSWORD || "").trim();
const port = Number(process.env.SMTP_PORT || "587");
const secure = process.env.SMTP_SECURE === "true" || port === 465;
const wantSend = process.argv[2] === "--send" && process.argv[3];

if (!process.env.SMTP_HOST || !user || !pass) {
    console.error("Falta SMTP_HOST, SMTP_USER o SMTP_PASSWORD en .env");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: 20_000,
    auth: { user, pass },
});

async function main() {
    if (!wantSend) {
        console.log("Conectando a", process.env.SMTP_HOST, "puerto", port, "…");
        await transporter.verify();
        console.log("OK: login SMTP (usuario y clave correctos).");
        return;
    }
    const to = process.argv[3];
    const from =
        (process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim()) ||
        `"ADESSO-365" <${user}>`;
    console.log("Enviando a", to, "desde", from, "…");
    const info = await transporter.sendMail({
        from,
        to,
        subject: "Prueba Brevo — ADESSO-365",
        text: "Si recibes esto, el remitente y SMTP están bien.",
    });
    console.log("OK: enviado, messageId =", info.messageId);
}

main().catch((e) => {
    console.error("FALLO:", e.message);
    if (e.response) console.error("Detalle del servidor:", e.response);
    process.exit(1);
});
