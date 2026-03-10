import type { INodeType, INodeTypeDescription, ISupplyDataFunctions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { supplyModel } from '@n8n/ai-node-sdk';

type ModelOptions = {
	temperature?: number;
	topP?: number;
	maxTokens?: number;
};

export class MiniMaxChatModel implements INodeType {
	description: INodeTypeDescription = {
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

		outputs: [NodeConnectionTypes.AiLanguageModel],
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
				default: 'M2-her',
				description: 'The model which will generate the completion',
				options: [
					{
						name: 'abab5.5-chat',
						value: 'abab5.5-chat',
					},
					{
						name: 'abab5.5s-chat',
						value: 'abab5.5s-chat',
					},
					{
						name: 'abab6.5g-chat',
						value: 'abab6.5g-chat',
					},
					{
						name: 'abab6.5s-chat',
						value: 'abab6.5s-chat',
					},
					{
						name: 'abab6.5t-chat',
						value: 'abab6.5t-chat',
					},
					{
						name: 'M2-Her',
						value: 'M2-her',
					},
					{
						name: 'M2-Highyer',
						value: 'M2-highyer',
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
						description:
							'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered',
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

	async supplyData(this: ISupplyDataFunctions, itemIndex: number) {
		const credentials = await this.getCredentials('miniMaxApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as ModelOptions;

		// MiniMax API v2 endpoint
		return supplyModel(this, {
			type: 'openai',
			baseUrl: 'https://api.minimaxi.com/v1',
			apiKey: credentials.apiKey as string,
			model: modelName,
			temperature: options.temperature,
			topP: options.topP,
			maxTokens: options.maxTokens,
		});
	}
}
