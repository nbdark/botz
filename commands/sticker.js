module.exports = {
  run: async (sock, from, m) => {
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage) {
      return sock.sendMessage(from, { text: "Photo එකක් Reply කරලා !sticker ගහපන් මචන්" });
    }
    await sock.sendMessage(from, { text: "Sticker Feature එක ඊළඟට දාමු!" });
  },
};
