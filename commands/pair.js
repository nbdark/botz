const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");

module.exports = {
  run: async (sock, from, m, args) => {
    let number = args[0];
    if (!number) {
      return sock.sendMessage(from, { text: "Number එක දාපන් මචන්!\n\nඋදාහරණයක්:\n*.pair 947XXXXXXXX*" });
    }

    number = number.replace(/[^0-9]/g, "");
    await sock.sendMessage(from, { text: "Pairing Code එක හදනවා... තප්පර 10ක් ඉන්න ⏳" });

    // හැම User ටම වෙන වෙනම Session Folder එකක්
    const sessionPath = `sessions/${number}`;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // අලුත් User ගේ Number එකට අලුත් Connection එකක් හදනවා
    const newSock = makeWASocket({
      logger: pino({ level: "silent" }),
      auth: state,
      printQRInTerminal: false,
      browser: ["My Bot", "Chrome", "1.0"],
    });

    newSock.ev.on("creds.update", saveCreds);

    // තප්පර 3කින් Pairing Code එක ඉල්ලනවා
    setTimeout(async () => {
      try {
        const code = await newSock.requestPairingCode(number);
        // Code එක ලස්සනට පෙන්නනවා
        const formatted = code.match(/.{1,4}/g).join("-");
        await sock.sendMessage(from, { 
          text: `✅ උඹේ Pairing Code එක:\n\n*${formatted}*\n\nWhatsApp එකේ:\nSettings > Linked Devices > Link with phone number instead > මේ Code එක ගහපන්` 
        });
      } catch (e) {
        console.log(e);
        await sock.sendMessage(from, { text: "Code එක ගන්න බැරි උනා. ආයේ .pair ගහපන්. Number එක හරිද බලපන්." });
      }
    }, 3000);

    newSock.ev.on("connection.update", (u) => {
      if (u.connection === "open") {
        console.log(`✅ ${number} Connected via .pair!`);
        sock.sendMessage(from, { text: `✅ ${number} Bot එකට Connect උනා! දැන් !menu ගහලා බලපන්.` });
        // මෙතනින් තමයි ඒ අලුත් User ගේ Bot එක Start වෙන්නේ
      }
    });
  },
};
