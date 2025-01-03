class MemoryManager {
    constructor() {
        this.memory = {};
    }

    initialize(uuid) {
        if (!this.memory[uuid]) {
            this.memory[uuid] = {
                // Flow
                state: "INTRO",
                problem: "",
                // screenshot: {"info": "L'enregistrement écran n'a pas été activé"},
                screenshot_raw: "", // base64

                // History
                messages: [],
                messages_audio: [],

                // Management
                is_from_text: false,
                is_waiting_for_silence: true,
                is_user_talking: false,
                is_assistant_thinking: false,
                is_assistant_talking: false,
                is_assistant_done_talking: false
                // is_checking_transcript: false,
            };
        }
        return this.memory[uuid];
    }

    get(uuid) {
        return this.memory[uuid];
    }

    set(uuid, key, value) {
        if (!this.memory[uuid]) {
            this.initialize(uuid);
        }
        this.memory[uuid][key] = value;
    }

    remove(uuid) {
        delete this.memory[uuid];
    }
}

module.exports = new MemoryManager();
