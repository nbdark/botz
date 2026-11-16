const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const pino = require("pino");

const logger = pino({ level: "silent" });
const KINDS = { imageMessage: "image", videoMessage: "video", audioMessage: "audio" };

function strip(m = {}) {
  const inner =
    m.viewOnceMessage?.message ||
    m.viewOnceMessageV2?.message ||
    m.viewOnceMessageV2Extension?.message ||
    m.ephemeralMessage?.message ||
    m.documentWithCaptionMessage?.message;
  return inner ? strip(inner) : m;
}

module.exports = {
  run: async (sock, from, m, args) => {
    // අපේ Base එකේ jid = from
    const jid = from;

    // Reply කරපු Message එක ගන්නවා
    const contextInfo = m.message?.extendedTextMessage?.contextInfo;
    if (!contextInfo?.quotedMessage) {
      return await sock.sendMessage(jid, { text: "View Once Message එකකට Reply කරලා .vo ගහපන් මචන්!" });
    }

    const inner = strip(contextInfo.quotedMessage);
    const type = Object.keys(inner).find((k) => KINDS[k]);
    if (!type) {
      return await sock.sendMessage(jid, { text: "Media එකක් හම්බුනේ නෑ මචන්!" });
    }

    // Download කරන්න Fake Message එකක් හදනවා
    const target = {
      key: {
        remoteJid: contextInfo.remoteJid || jid,
        id: contextInfo.stanzaId,
        participant: contextInfo.participant,
        fromMe: false,
      },
      message: inner,
    };

    let buffer;
    try {
      buffer = await downloadMediaMessage(target, "buffer", {}, {
        logger,
        reuploadRequest: sock.updateMediaMessage,
      });
    } catch (e) {
      return await sock.sendMessage(jid, { text: `Download Failed: ${e.message}` });
    }

    const content = inner[type];
    const caption = content.caption || undefined;
    const kind = KINDS[type];

    const payload =
      kind === "image"
        ? { image: buffer, caption }
        : kind === "video"
        ? { video: buffer, caption, mimetype: content.mimetype }
        : { audio: buffer, mimetype: content.mimetype || "audio/ogg; codecs=opus", ptt: !!content.ptt };

    try {
      await sock.sendMessage(jid, payload, { quoted: m });
    } catch (e) {
      await sock.sendMessage(jid, { text: `Send Failed: ${e.message}` });
    }
  },
};
