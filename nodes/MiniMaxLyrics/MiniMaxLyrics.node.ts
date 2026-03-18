import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class MiniMaxLyrics implements INodeType {
	description: INodeTypeDescription = {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const mode = this.getNodeParameter('mode', i) as string;
				const prompt = this.getNodeParameter('prompt', i) as string;

				if (!prompt || !prompt.trim()) {
					throw new NodeOperationError(this.getNode(), 'Prompt is required.', { itemIndex: i });
				}

				const body: IDataObject = {
					mode,
					prompt,
				};

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'miniMaxApi',
					{
						method: 'POST',
						url: 'https://api.minimax.io/v1/lyrics_generation',
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
