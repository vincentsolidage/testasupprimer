const {OpenAI} = require('openai');
const { ConversationStates } = require('./states.js');

const openaiClient = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
module.exports = {
    getResponse: async ({
        system_prompt,  
        variables = {}, 
        history = [], 
        images = [],
        model = "gpt-4o-mini",
        type = "text",
    }) => {
        system_prompt = system_prompt.replace(/{{(\w+)}}/g, (match, key) => {
            return JSON.stringify(variables[key]) || match;
        });
        images = images.filter((image) => !!image);
        const images_content = images.length > 0 ? [
            {role: "user", content: [...images.map((image) => {
                    return {type: "image_url", image_url: {url: image}}
                })]
            }
        ] : []
        const messages = [
            {
                role: "system",
                content: system_prompt
            },
            ...history,
            ...images_content
        ]
        // console.log(messages);
        const body = {
            model: model,
            messages: messages,
            temperature: 0.0,
        }
        if (model.includes("audio")){
            body.audio = {
                "voice": "ash",
                "format": "pcm16"
            };
            body.stream = true
            body.modalities = ["text", "audio"];
            console.warn("[AUDIO]");
            const response = await openaiClient.chat.completions.create(body)
            return response;
        }else{
            console.warn("[",type.toUpperCase(),"]");
            body.response_format = {type: type};
            const response = await openaiClient.chat.completions.create(body)
            const msg = response.choices.pop().message.content
            return type == "json_object" ? JSON.parse(msg) : msg
        }
    },
    
    getResponseStream: async ({
        system_prompt,  
        variables = {}, 
        history = [], 
        images = [],
        model = "gpt-4o-mini",
        type = "text",
    }) => {
        system_prompt = system_prompt.replace(/{{(\w+)}}/g, (match, key) => {
            return JSON.stringify(variables[key]) || match;
        });
        images = images.filter((image) => !!image);
        const images_content = images.length > 0 ? [
            {role: "user", content: [...images.map((image) => {
                    return {type: "image_url", image_url: {url: image}}
                })]
            }
        ] : []
        console.log(images_content);
        const messages = [
            {
                role: "user",
                content: system_prompt
            },
            ...history,
            ...images_content
        ]
        const body = {
            model: model,
            messages: messages,
            temperature: 0.0,
            stream: true
        }

        console.warn("[",type.toUpperCase(),"]");
        body.response_format = {type: type};
        const stream = openaiClient.chat.completions.create(body)
        return stream
    },

    speechToText: async (audioBlob) => {
        const audioFile = new File([audioBlob], 'recording.webm', {
            type: 'audio/webm'
        });
        const response = await openaiClient.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            // language: "fr"
        });
        return response.text;
    },

    streamAudio: async (socket, response) => {
        let audio_id;
        let datas = [];
        let transcript = "";
        socket.memory.is_assistant_talking = true;
        socket.emit('state', ConversationStates.ASSISTANT_SPEAKING);
        for await (const chunk of response) { 
            const msg = chunk.choices.pop().delta.audio; 
            if (!msg) continue;
            if (msg.id) audio_id = msg.id;
            if (msg.transcript) transcript += msg.transcript;
            if (msg.data) {
                datas.push(msg.data);
                if (datas.length >= 3) {
                    socket.emit('stop-sound');
                    socket.emit('assistant-voice', datas.join(''));
                    datas = [];
                }
            }
        }
        if (datas.length > 0) socket.emit('assistant-voice', datas.join(''));            
        socket.memory.is_assistant_talking = false;
        socket.memory.is_assistant_done_talking = true;
        // socket.emit('assistant-message', transcript);
        socket.addAssistantMessage({ content: transcript, audio_id: audio_id });
        setTimeout(() => {
            socket.emit('state', ConversationStates.ASSISTANT_DONE_SPEAKING);
        }, 2000);
    }
};



