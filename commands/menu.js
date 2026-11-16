const config = require("../config");
module.exports = {
  run: async (sock, from, m) => {
    const menu = `*${config.botName} MENU*
    
${config.prefix}ping - Bot වැඩද බලන්න
${config.prefix}menu - මේ Menu එක
${config.prefix}sticker - Photo එක Sticker කරන්න`;
    await sock.sendMessage(from, { text: menu });
  },
};
