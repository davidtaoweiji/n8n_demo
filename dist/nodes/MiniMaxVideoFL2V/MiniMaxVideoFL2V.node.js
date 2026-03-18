"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxVideoFl2v = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MiniMaxVideoFl2v {
    constructor() {
        this.description = {
            displayName: 'MiniMax Video: First & Last Frame to Video',
            name: 'miniMaxVideoFl2v',
            icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Create a video generation task from start and end frame images using MiniMax Video API',
            usableAsTool: true,
            defaults: {
                name: 'MiniMax Video: First & Last Frame to Video',
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
                    default: 'MiniMax-Hailuo-02',
                    description: 'Video generation model to use',
                    options: [{ name: 'MiniMax-Hailuo-02', value: 'MiniMax-Hailuo-02' }],
                },
                {
                    displayName: 'First Frame Image',
                    name: 'firstFrameImage',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'Image to use as the starting frame. Accepts a public URL or a Base64 Data URL (data:image/jpeg;base64,...). Formats: JPG, JPEG, PNG, WebP. Max 20MB. Short side > 300px. Video resolution follows this image.',
                },
                {
                    displayName: 'Last Frame Image',
                    name: 'lastFrameImage',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'Image to use as the ending frame. Accepts a public URL or a Base64 Data URL (data:image/jpeg;base64,...). Formats: JPG, JPEG, PNG, WebP. Max 20MB. Short side > 300px. Will be cropped to match the first frame if sizes differ.',
                },
                {
                    displayName: 'Prompt',
                    name: 'prompt',
                    type: 'string',
                    typeOptions: { rows: 4 },
                    default: '',
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
                    description: 'Video resolution. Note: 512P is not supported for first & last frame generation.',
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
        var _a;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const model = this.getNodeParameter('model', i);
                const firstFrameImage = this.getNodeParameter('firstFrameImage', i);
                const lastFrameImage = this.getNodeParameter('lastFrameImage', i);
                const prompt = this.getNodeParameter('prompt', i, '');
                const duration = this.getNodeParameter('duration', i);
                const resolution = this.getNodeParameter('resolution', i);
                const options = this.getNodeParameter('options', i, {});
                if (!firstFrameImage || !firstFrameImage.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'First Frame Image is required.', {
                        itemIndex: i,
                    });
                }
                if (!lastFrameImage || !lastFrameImage.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Last Frame Image is required.', {
                        itemIndex: i,
                    });
                }
                const body = {
                    model,
                    first_frame_image: firstFrameImage,
                    last_frame_image: lastFrameImage,
                    duration,
                    resolution,
                    prompt_optimizer: (_a = options.promptOptimizer) !== null && _a !== void 0 ? _a : true,
                };
                if (prompt && prompt.trim()) {
                    body.prompt = prompt;
                }
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
exports.MiniMaxVideoFl2v = MiniMaxVideoFl2v;
//# sourceMappingURL=MiniMaxVideoFl2v.node.js.map