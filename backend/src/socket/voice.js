const { throttle } = require('../../app');
const { handleVoiceTranscript } = require('./flow.js')
const { ConversationStates } = require('../utils/states.js');

const { speechToText } = require('../utils/openai');

module.exports = (socket) => {
    
    socket.on(ConversationStates.USER_READY, () => {
        console.warn('> User ready');
        socket.memory.is_from_text = false;
    });

    socket.on(ConversationStates.USER_SPEAKING, () => {
        console.warn('> User speaking');
        socket.memory.is_user_talking = true;
    });

    socket.on(ConversationStates.USER_SILENCE, () => {
        console.warn('> User silence');
        socket.emit('screenshot');
        socket.memory.is_user_talking = false;
    })

    socket.on(ConversationStates.USER_DONE_SPEAKING, throttle((data) => {
        console.warn('> User done speaking (data)');
        console.log('>> User buffer:', data);
        const buffer = Buffer.concat([data]);
        speechToText(buffer).then(async (transcript) => {
            console.log('>> User transcript:', transcript);
            // NOTE: Fix for blank transcript of Whisper;
            transcript = transcript.replace(/bye/gi, '').trim();
            await handleVoiceTranscript(socket, transcript);
        }).catch((error) => {
            console.error('Error while processing voice', error);
            // FIXME: il faudrait gérer l'erreur et boucler pour que l'utilisateur puise reparler directement
            socket.emit('assistant-message', "Désolé, je n'ai pas compris ce que vous avez dit.");
            socket.emit('state', ConversationStates.USER_READY);
        });
        socket.memory.buffers = [];
    }, 1000));


    socket.on(ConversationStates.ASSISTANT_THINKING, () => {
        console.warn('> Assistant thiking (callback)');
    });
    
    socket.on(ConversationStates.AVAILABLE, () => {
        if (socket.memory.is_assistant_done_talking) {
            console.warn('> Assistant done speaking (callback)');
            socket.memory.is_assistant_done_talking = false;
            setTimeout(()=> {
                socket.emit('play-sound', {sound_name: "user-turn.mp3", volume: 0.2})
            , 1500});
        }
    });

    socket.on(ConversationStates.STOPPED, () => {
        console.warn('> Conversation stopped');
    });
}