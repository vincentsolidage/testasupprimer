const {io} = require('../app.js');
const MemoryManager = require('./utils/memory.js');

let memory = {};

io.on('connection', (socket) => {

    console.log('New connection:', socket.id);

    socket.on('identity', (message) => {
        
        if(message.token){
            let token = message.token;
            if (token.length == 20) {
                socket.uuid = token;
            }
        }
        
        if(!socket.uuid){
            socket.uuid = socket.id;
            socket.emit('identity', { token: socket.uuid });
        }

        console.log('Identity:', socket.uuid);
        socket.join(socket.uuid);
        socket.memory = MemoryManager.initialize(socket.uuid);

        socket.addUserMessage = (content) => {
            socket.memory.messages.push({ role: "user", content });
            socket.memory.messages_audio.push({ role: "user", content });
        }

        socket.addAssistantMessage = ({
            content = "",
            audio_id = ""
        }) => {
            if (content) socket.memory.messages.push({ role: "assistant", content });
            if (audio_id) socket.memory.messages_audio.push({ role: "assistant", audio: { id: audio_id } });
        }

        require("./socket/voice.js")(socket);
        require("./socket/screen.js")(socket);
        require("./socket/message.js")(socket);
    }) 

    socket.on('disconnect', () => {
        // TODO: remove the session after a while to save up memory
        // NOTE: Au final, on supprime directement la session
        MemoryManager.remove(socket.uuid);
    });

});

module.exports = {
    memory
}