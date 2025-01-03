const { io } = require('../socket.js');
const { handleVoiceTranscript } = require('./flow.js');

module.exports = (socket) => {

    socket.on('user-message', async (text) => {
        setTimeout(async () => {
            socket.emit("screenshot");
            switch (text) {
                case "!memory":
                    socket.emit('assistant-message', JSON.stringify(socket.memory));
                    break;
                default:
                    socket.memory.is_from_text = true;
                    await handleVoiceTranscript(socket, text);
            }
        }, 1000);
    });

};