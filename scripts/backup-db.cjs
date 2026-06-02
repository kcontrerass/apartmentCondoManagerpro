/**
 * Copia de seguridad MySQL usando DATABASE_URL del .env (formato Prisma: mysql://...).
 * Uso: node scripts/backup-db.cjs
 * Requiere: mysqldump en PATH (MySQL / MariaDB client).
 * Salida: prisma/backups/adesso-YYYY-MM-DDTHH-mm-ss.sql
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const urlRaw = process.env.DATABASE_URL;
if (!urlRaw || !urlRaw.trim()) {
    console.error("DATABASE_URL no está definida en .env");
    process.exit(1);
}

let u;
try {
    u = new URL(urlRaw.trim());
} catch {
    console.error("DATABASE_URL no es una URL válida");
    process.exit(1);
}

if (u.protocol !== "mysql:") {
    console.error("Este script solo aplica a MySQL (mysql://). Protocolo:", u.protocol);
    process.exit(1);
}

const user = decodeURIComponent(u.username || "");
const password = decodeURIComponent(u.password || "");
const host = u.hostname;
const port = u.port || "3306";
const database = decodeURIComponent((u.pathname || "/").replace(/^\//, "").split("?")[0] || "");

if (!host || !database) {
    console.error("No se pudo obtener host o nombre de base desde DATABASE_URL");
    process.exit(1);
}

const outDir = path.join(__dirname, "..", "prisma", "backups");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outFile = path.join(outDir, `adesso-${stamp}.sql`);

const args = [
    `-h${host}`,
    `-P${port}`,
    `-u${user}`,
    `-p${password}`,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--set-gtid-purged=OFF",
    "--column-statistics=0",
    database,
];

const writeStream = fs.createWriteStream(outFile);
const child = spawn("mysqldump", args, { stdio: ["ignore", "pipe", "pipe"] });

child.stdout.pipe(writeStream);
let errBuf = "";
child.stderr.on("data", (c) => {
    errBuf += c.toString();
});

child.on("close", (code) => {
    writeStream.close();
    if (code !== 0) {
        try {
            fs.unlinkSync(outFile);
        } catch {
            /* ignore */
        }
        console.error("mysqldump falló:", code);
        if (errBuf.trim()) console.error(errBuf.trim());
        process.exit(code || 1);
    }
    const stat = fs.statSync(outFile);
    console.log("Copia guardada:", outFile);
    console.log("Tamaño:", Math.round(stat.size / 1024), "KB");
});
