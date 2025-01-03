const { getResponse, streamAudio } = require('../utils/openai.js');
const {
	promptProblemExplanation,
	promptIntent,
	promptProblemSummary,
	promptSilenceOrEndTranscript,
	promptGuidance
} = require('../utils/prompts.js');
const { ConversationStates } = require('../utils/states.js');

handleVoiceTranscript = async function (socket, text) {
	if (
		socket.memory.is_user_talking ||
		socket.memory.is_assistant_talking ||
		socket.memory.is_assistant_thinking
	) return;
	socket.emit('user-message', text);
	socket.addUserMessage(text);

	socket.memory.is_assistant_thinking = true;
	socket.emit('state', ConversationStates.ASSISTANT_THINKING);
	socket.emit('play-sound', { sound_name: "thinking.mp3", volume: 0.3 });

	// console.log('State:', socket.memory.state);
	// console.log('Memory:', JSON.stringify(socket.memory.messages));

	switch (socket.memory.state.toUpperCase()) {

		case 'INTRO':
			await stateProblemExplanationMoreInfo(socket);
			break;

		case 'PROBLEM-EXPLANATION':
			const intent = await getIntent(text);
			switch (intent) {
				case 'MORE_INFO':
					await stateProblemExplanationMoreInfo(socket);
					break;
				case 'VALIDATION':
					socket.memory.state = 'step-by-step';
					const summary = await stateProblemSummary(socket);
					socket.memory.problem = summary;
					// socket.emit('assistant-message', summary); // DEBUG
					socket.memory.messages = [{
						role: "user",
						content: "Explique l'étape 1"
					}];
					await stateGuidance(socket);
					break;
			}
			break;

		case 'STEP-BY-STEP':
			await stateGuidance(socket);
			break;
	}
	socket.memory.is_assistant_thinking = false;
},

	sendTextOrAudioResponse = async (socket, response) => {
		if (socket.memory.is_from_text) {
			transcript = response;
			socket.addAssistantMessage({ content: transcript });
		} else {
			socket.emit('assistant-message', response);
			const audioStream = await getResponse({
				system_prompt: "You should always repeat what the user says, in French without modification.",
				history: [
					{ role: "user", content: "Répète exactement ceci: " + response}
				],
				model: "gpt-4o-mini-audio-preview",
			})
			await streamAudio(socket, audioStream);
		}
	},

	stateProblemExplanationMoreInfo = async (socket) => {
		response = getResponse(
			{
				system_prompt: promptProblemExplanation,
				images: [socket.memory.screenshot_raw],
				history: socket.memory.messages, //  socket.memory.is_from_text ? socket.memory.messages : socket.memory.messages_audio,
				model: "gpt-4o",
			}
		).then(async (response) => {
			await sendTextOrAudioResponse(socket, response);
			socket.memory.state = 'problem-explanation';
		})
	},

	stateProblemSummary = async (socket) => {
		const response = await getResponse({
			system_prompt: promptProblemSummary,
			images: [socket.memory.screenshot_raw],
			history: socket.memory.messages,
			type: "json_object",
			model: "gpt-4o-mini",
		})
		return response.restitution;
	},

	stateGuidance = async (socket) => {
		response = getResponse({
			system_prompt: promptGuidance,
			variables: {
				"PROBLEME": socket.memory.problem
			},
			images: [socket.memory.screenshot_raw],
			history: socket.memory.messages, //  socket.memory.is_from_text ? socket.memory.messages : socket.memory.messages_audio,
			model: "gpt-4o", //socket.memory.is_from_text ? "gpt-4o" : "gpt-4o-audio-preview",
		}).then(async (response) => {
			await sendTextOrAudioResponse(socket, response);
		}).catch((error) => {
			console.error('Error while getting response:', error);
		})
	},

	getIntent = async (text) => {
		response = await getResponse({
			system_prompt: promptIntent,
			variables: {
				"CATEGORIES": JSON.stringify([
					"MORE_INFO : L'user donne des précisions ou corrige le problème",
					"VALIDATION : L'user confirme le problème",
				])
			},
			history: [
				{ role: "user", content: text }
			],
			type: "json_object"
		})
		return response.intent;
	}


module.exports = {
	handleVoiceTranscript,
}