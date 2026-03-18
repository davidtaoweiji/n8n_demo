import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class MiniMaxVideoI2V implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MiniMax Video: Image to Video',
		name: 'miniMaxVideoI2V',
		icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Create a video generation task from a first-frame image using MiniMax Video API',
		usableAsTool: true,
		defaults: {
			name: 'MiniMax Video: Image to Video',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
					{ name: 'MiniMax-Hailuo-2.3-Fast', value: 'MiniMax-Hailuo-2.3-Fast' },
					{ name: 'MiniMax-Hailuo-02', value: 'MiniMax-Hailuo-02' },
				],
			},
			{
				displayName: 'First Frame Image',
				name: 'firstFrameImage',
				type: 'string',
				default: '',
				required: true,
				description:
					'Image to use as the starting frame. Accepts a public URL or a Base64 Data URL (data:image/jpeg;base64,...). Formats: JPG, JPEG, PNG, WebP. Max 20MB. Short side > 300px.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description:
					'Text description of the video (up to 2000 characters). Supports camera commands like [Pan left], [Push in], [Static shot], etc.',
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
				description:
					'Video resolution. MiniMax-Hailuo-02 additionally supports 512P.',
				options: [
					{ name: '512P (Hailuo-02 Only)', value: '512P' },
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const model = this.getNodeParameter('model', i) as string;
				const firstFrameImage = this.getNodeParameter('firstFrameImage', i) as string;
				const prompt = this.getNodeParameter('prompt', i, '') as string;
				const duration = this.getNodeParameter('duration', i) as number;
				const resolution = this.getNodeParameter('resolution', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				if (!firstFrameImage || !firstFrameImage.trim()) {
					throw new NodeOperationError(this.getNode(), 'First Frame Image is required.', {
						itemIndex: i,
					});
				}

				const body: IDataObject = {
					model,
					first_frame_image: firstFrameImage,
					duration,
					resolution,
					prompt_optimizer: (options.promptOptimizer as boolean | undefined) ?? true,
					fast_pretreatment: (options.fastPretreatment as boolean | undefined) ?? false,
				};

				if (prompt && prompt.trim()) {
					body.prompt = prompt;
				}

				if (options.callbackUrl) {
					body.callback_url = options.callbackUrl;
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'miniMaxApi',
					{
						method: 'POST',
						url: 'https://api.minimax.io/v1/video_generation',
						body,
						json: true,
					},
				);

				returnData.push({
					json: responseData as IDataObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(
					this.getNode(),
					{ message: (error as Error).message },
					{ itemIndex: i },
				);
			}
		}

		return [returnData];
	}
}
