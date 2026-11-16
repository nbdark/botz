module.exports = {
  run: async (sock, from, m, args) => {
    await sock.sendMessage(from, { text: "මේ Bot එකේ Owner <3" });
  },
};
