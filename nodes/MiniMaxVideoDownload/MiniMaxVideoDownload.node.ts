import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const toBuffer = (value: unknown): Buffer | undefined => {
	if (Buffer.isBuffer(value)) return value;
	if (value instanceof ArrayBuffer) return Buffer.from(value);
	return undefined;
};

export class MiniMaxVideoDownload implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MiniMax Video: Download',
		name: 'miniMaxVideoDownload',
		icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
		group: ['transform'],
		version: 1,
		description:
			'Retrieve the download URL (and optionally binary data) for a generated MiniMax video using its file_id.',
		usableAsTool: true,
		defaults: {
			name: 'MiniMax Video: Download',
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
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				required: true,
				description: 'The file_id returned when a video generation task succeeds',
			},
			{
				displayName: 'Return Binary',
				name: 'returnBinary',
				type: 'boolean',
				default: true,
				description:
					'Whether to download the video and return it as binary data on property "video". If false, only the download URL is returned in JSON.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const fileId = this.getNodeParameter('fileId', i) as string;
				const returnBinary = this.getNodeParameter('returnBinary', i, true) as boolean;

				if (!fileId || !fileId.trim()) {
					throw new NodeOperationError(this.getNode(), 'File ID is required.', { itemIndex: i });
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'miniMaxApi',
					{
						method: 'GET',
						url: 'https://api.minimax.io/v1/files/retrieve',
						qs: { file_id: fileId },
						json: true,
					},
				);

				const responseJson = responseData as IDataObject;
				const fileInfo = responseJson.file as IDataObject | undefined;
				const downloadUrl = fileInfo?.download_url as string | undefined;

				const outputItem: INodeExecutionData = {
					json: responseJson,
					pairedItem: { item: i },
				};

				if (returnBinary && downloadUrl) {
					const videoData = await this.helpers.httpRequest({
						method: 'GET',
						url: downloadUrl,
						encoding: 'arraybuffer',
						json: false,
					});
					const videoBuffer = toBuffer(videoData);
					if (videoBuffer && videoBuffer.length > 0) {
						const filename = (fileInfo?.filename as string | undefined) || `minimax-video-${fileId}.mp4`;
						outputItem.binary = {
							video: await this.helpers.prepareBinaryData(videoBuffer, filename, 'video/mp4'),
						};
					}
				}

				returnData.push(outputItem);
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
