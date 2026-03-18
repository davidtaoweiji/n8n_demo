import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class MiniMaxVideoQuery implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MiniMax Video: Query Task',
		name: 'miniMaxVideoQuery',
		icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
		group: ['transform'],
		version: 1,
		description:
			'Query the status of a MiniMax video generation task. Returns task_id, status, and file_id on success.',
		usableAsTool: true,
		defaults: {
			name: 'MiniMax Video: Query Task',
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
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				default: '',
				required: true,
				description: 'The task ID returned from a video generation request',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const taskId = this.getNodeParameter('taskId', i) as string;

				if (!taskId || !taskId.trim()) {
					throw new NodeOperationError(this.getNode(), 'Task ID is required.', { itemIndex: i });
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'miniMaxApi',
					{
						method: 'GET',
						url: 'https://api.minimax.io/v1/query/video_generation',
						qs: { task_id: taskId },
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
