const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const config = require("./config");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["My Bot", "Chrome", "1.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("QR එක Scan කරපන්:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection Close උනා, Reconnect වෙනවා...");
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot Connected! " + config.botName);
    }
  });

  // Message එකක් ආවම මෙතනින් අල්ලගන්නවා
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
    if (!body.startsWith(config.prefix)) return;

    const args = body.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // commands folder එකේ තියෙන file එක load කරනවා
    const cmdPath = path.join(__dirname, "commands", `${command}.js`);
    if (fs.existsSync(cmdPath)) {
      try {
        const cmd = require(cmdPath);
        await cmd.run(sock, from, m, args);
      } catch (e) {
        console.log(e);
        await sock.sendMessage(from, { text: "Error එකක් ආවා මචන්!" });
      }
    }
  });
}

startBot();
