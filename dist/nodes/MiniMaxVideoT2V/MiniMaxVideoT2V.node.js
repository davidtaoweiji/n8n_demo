"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxVideoT2V = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MiniMaxVideoT2V {
    constructor() {
        this.description = {
            displayName: 'MiniMax Video: Text to Video',
            name: 'miniMaxVideoT2V',
            icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Create a video generation task from a text prompt using MiniMax Video API',
            usableAsTool: true,
            defaults: {
                name: 'MiniMax Video: Text to Video',
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
                    displayName: 'Model',
                    name: 'model',
                    type: 'options',
                    default: 'MiniMax-Hailuo-2.3',
                    description: 'Video generation model to use',
                    options: [
                        { name: 'MiniMax-Hailuo-2.3', value: 'MiniMax-Hailuo-2.3' },
                        { name: 'MiniMax-Hailuo-02', value: 'MiniMax-Hailuo-02' },
                    ],
                },
                {
                    displayName: 'Prompt',
                    name: 'prompt',
                    type: 'string',
                    typeOptions: { rows: 4 },
                    default: '',
                    required: true,
                    description: 'Text description of the video (up to 2000 characters). Supports camera commands like [Pan left], [Push in], [Static shot], etc.',
                },
                {
                    displayName: 'Duration (Seconds)',
                    name: 'duration',
                    type: 'options',
                    default: 6,
                    description: 'Duration of the generated video',
                    options: [
                        { name: '6s', value: 6 },
                        { name: '10s', value: 10 },
                    ],
                },
                {
                    displayName: 'Resolution',
                    name: 'resolution',
                    type: 'options',
                    default: '768P',
                    description: 'Video resolution (1080P only available for 6s duration)',
                    options: [
                        { name: '768P', value: '768P' },
                        { name: '1080P', value: '1080P' },
                    ],
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Prompt Optimizer',
                            name: 'promptOptimizer',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to automatically optimize the prompt',
                        },
                        {
                            displayName: 'Fast Pretreatment',
                            name: 'fastPretreatment',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to reduce optimization time when prompt optimizer is enabled',
                        },
                        {
                            displayName: 'Callback URL',
                            name: 'callbackUrl',
                            type: 'string',
                            default: '',
                            description: 'URL to receive asynchronous task status updates',
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        var _a, _b;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const model = this.getNodeParameter('model', i);
                const prompt = this.getNodeParameter('prompt', i);
                const duration = this.getNodeParameter('duration', i);
                const resolution = this.getNodeParameter('resolution', i);
                const options = this.getNodeParameter('options', i, {});
                if (!prompt || !prompt.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Prompt is required.', { itemIndex: i });
                }
                const body = {
                    model,
                    prompt,
                    duration,
                    resolution,
                    prompt_optimizer: (_a = options.promptOptimizer) !== null && _a !== void 0 ? _a : true,
                    fast_pretreatment: (_b = options.fastPretreatment) !== null && _b !== void 0 ? _b : false,
                };
                if (options.callbackUrl) {
                    body.callback_url = options.callbackUrl;
                }
                const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'miniMaxApi', {
                    method: 'POST',
                    url: 'https://api.minimax.io/v1/video_generation',
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
exports.MiniMaxVideoT2V = MiniMaxVideoT2V;
//# sourceMappingURL=MiniMaxVideoT2V.node.js.map