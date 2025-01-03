const { throttle } = require('../../app');
const { getResponse, streamAudio } = require("../utils/openai");
const { promptScreenshotDescription } = require("../utils/prompts");


module.exports = (socket) => {

    socket.on('user-screen', throttle(async (blob) => {
        console.log('> Screenshot received');
        try {
            let base64 = "data:image/jpeg;base64," + blob.toString('base64');
            // socket.emit('play-sound', {sound_name: "screenshot.mp3", volume: 0.2});
            console.log(base64.slice(0, 30));
            socket.memory.screenshot_raw = base64;
            // getResponse({
            //     system_prompt: promptScreenshotDescription,
            //     images: [base64],
            //     model: "gpt-4o-mini",
            //     type: "text"
            // }).then((description) => {
            //     socket.memory.screenshot = {
            //         description: description, 
            //         ...{
            //             date: new Date().toLocaleDateString(),
            //             time: new Date().toLocaleTimeString()
            //         }
            //     };
            //     console.warn('> Screenshot done');
            //     // console.log('Screenshot description:', JSON.stringify(socket.memory.screenshot));
            // });
        } catch (error) {
            console.error('Error while processing screenshot:', error);
        }
    }, 1000));
};