"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxChatModel = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const ai_node_sdk_1 = require("@n8n/ai-node-sdk");
class MiniMaxChatModel {
    constructor() {
        this.description = {
            displayName: 'MiniMax Chat Model',
            name: 'miniMaxChatModel',
            icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Chat model node for MiniMax API',
            defaults: {
                name: 'MiniMax Chat Model',
            },
            codex: {
                categories: ['AI'],
                subcategories: {
                    AI: ['Language Models', 'Root Nodes'],
                    'Language Models': ['Chat Models (Recommended)'],
                },
                resources: {
                    primaryDocumentation: [
                        {
                            url: 'https://platform.minimax.io',
                        },
                    ],
                },
            },
            inputs: [],
            outputs: [n8n_workflow_1.NodeConnectionTypes.AiLanguageModel],
            outputNames: ['Model'],
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
                    default: 'MiniMax-M2.5',
                    description: 'The model which will generate the completion',
                    options: [
                        {
                            name: 'MiniMax-M2.5',
                            value: 'MiniMax-M2.5',
                        },
                        {
                            name: 'MiniMax-M2.1',
                            value: 'MiniMax-M2.1',
                        },
                    ],
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    placeholder: 'Add Option',
                    description: 'Additional options to add',
                    type: 'collection',
                    default: {},
                    options: [
                        {
                            displayName: 'Sampling Temperature',
                            name: 'temperature',
                            default: 0.7,
                            typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
                            description: 'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
                            type: 'number',
                        },
                        {
                            displayName: 'Nucleus Sampling (Top P)',
                            name: 'topP',
                            default: 0.95,
                            typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
                            description: 'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered',
                            type: 'number',
                        },
                        {
                            displayName: 'Max Tokens',
                            name: 'maxTokens',
                            default: 2048,
                            typeOptions: { maxValue: 32000, minValue: 1, numberPrecision: 0 },
                            description: 'The maximum number of tokens to generate in the completion',
                            type: 'number',
                        },
                    ],
                },
            ],
        };
    }
    async supplyData(itemIndex) {
        const credentials = await this.getCredentials('miniMaxApi');
        const modelName = this.getNodeParameter('model', itemIndex);
        const options = this.getNodeParameter('options', itemIndex, {});
        return (0, ai_node_sdk_1.supplyModel)(this, {
            type: 'openai',
            baseUrl: 'https://api.minimaxi.com/v1',
            apiKey: credentials.apiKey,
            model: modelName,
            temperature: options.temperature,
            topP: options.topP,
            maxTokens: options.maxTokens,
        });
    }
}
exports.MiniMaxChatModel = MiniMaxChatModel;
//# sourceMappingURL=MiniMaxChatModel.node.js.map