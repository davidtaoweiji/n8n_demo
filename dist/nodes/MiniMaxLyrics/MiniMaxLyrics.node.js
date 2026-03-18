"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxLyrics = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MiniMaxLyrics {
    constructor() {
        this.description = {
            displayName: 'MiniMax Lyrics',
            name: 'miniMaxLyrics',
            icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Generate song lyrics using MiniMax Lyrics API',
            usableAsTool: true,
            defaults: {
                name: 'MiniMax Lyrics',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'miniMaxApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Mode',
                    name: 'mode',
                    type: 'options',
                    default: 'write_full_song',
                    description: 'Lyrics generation mode',
                    options: [
                        {
                            name: 'Write Full Song',
                            value: 'write_full_song',
                            description: 'Generate a complete set of lyrics from a prompt',
                        },
                    ],
                },
                {
                    displayName: 'Prompt',
                    name: 'prompt',
                    type: 'string',
                    typeOptions: {
                        rows: 4,
                    },
                    default: '',
                    required: true,
                    description: 'Description of the song you want lyrics for, e.g. "A cheerful love song about a summer day at the beach"',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const mode = this.getNodeParameter('mode', i);
                const prompt = this.getNodeParameter('prompt', i);
                if (!prompt || !prompt.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Prompt is required.', { itemIndex: i });
                }
                const body = {
                    mode,
                    prompt,
                };
                const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'miniMaxApi', {
                    method: 'POST',
                    url: 'https://api.minimax.io/v1/lyrics_generation',
                    body,
                    json: true,
                });
                returnData.push({
                    json: responseData,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeApiError(this.getNode(), { message: error.message }, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.MiniMaxLyrics = MiniMaxLyrics;
//# sourceMappingURL=MiniMaxLyrics.node.js.map