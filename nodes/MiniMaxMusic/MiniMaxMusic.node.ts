import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const getAudioMimeType = (format: string): string => {
	switch (format.toLowerCase()) {
		case 'wav':
			return 'audio/wav';
		case 'mp3':
		default:
			return 'audio/mpeg';
	}
};

const toBuffer = (value: unknown): Buffer | undefined => {
	if (Buffer.isBuffer(value)) {
		return value;
	}
	if (typeof value === 'string') {
		return Buffer.from(value, 'binary');
	}
	if (value instanceof ArrayBuffer) {
		return Buffer.from(value);
	}
	return undefined;
};

export class MiniMaxMusic implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MiniMax Music',
		name: 'miniMaxMusic',
		icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate music from a prompt using MiniMax Music API',
		usableAsTool: true,
		defaults: {
			name: 'MiniMax Music',
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
				default: 'music-2.5+',
				description: 'Music generation model to use',
				options: [
					{
						name: 'music-2.5+',
						value: 'music-2.5+',
					},
					{
						name: 'music-2.5',
						value: 'music-2.5',
					},
				],
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				required: true,
				description: 'Style/mood description for the generated music, e.g. "Indie folk, melancholic, introspective"',
			},
			{
				displayName: 'Lyrics',
				name: 'lyrics',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '',
				description:
					'Optional lyrics for the generated music. Use [verse], [chorus], [bridge] tags to structure sections.',
			},
			{
				displayName: 'Audio Settings',
				name: 'audioSettings',
				type: 'collection',
				placeholder: 'Add Audio Setting',
				default: {},
				options: [
					{
						displayName: 'Sample Rate',
						name: 'sampleRate',
						type: 'number',
						default: 44100,
						typeOptions: { minValue: 8000, maxValue: 48000, numberPrecision: 0 },
						description: 'Audio sample rate in Hz',
					},
					{
						displayName: 'Bitrate',
						name: 'bitrate',
						type: 'number',
						default: 256000,
						typeOptions: { minValue: 32000, maxValue: 320000, numberPrecision: 0 },
						description: 'Audio bitrate in bits per second',
					},
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						default: 'mp3',
						description: 'Audio output format',
						options: [
							{
								name: 'MP3',
								value: 'mp3',
							},
							{
								name: 'WAV',
								value: 'wav',
							},
						],
					},
				],
			},
			{
				displayName: 'Return Binary',
				name: 'returnBinary',
				type: 'boolean',
				default: true,
				description: 'Whether to return the generated audio as binary data on property "audio"',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const model = this.getNodeParameter('model', i) as string;
				const prompt = this.getNodeParameter('prompt', i) as string;
				const lyrics = this.getNodeParameter('lyrics', i, '') as string;
				const audioSettings = this.getNodeParameter('audioSettings', i, {}) as IDataObject;
				const returnBinary = this.getNodeParameter('returnBinary', i, true) as boolean;

				if (!prompt || !prompt.trim()) {
					throw new NodeOperationError(this.getNode(), 'Prompt is required.', { itemIndex: i });
				}

				const selectedFormat = ((audioSettings.format as string | undefined) ?? 'mp3').toLowerCase();

				const body: IDataObject = {
					model,
					prompt,
					audio_setting: {
						sample_rate: (audioSettings.sampleRate as number | undefined) ?? 44100,
						bitrate: (audioSettings.bitrate as number | undefined) ?? 256000,
						format: selectedFormat,
					},
				};

				if (lyrics && lyrics.trim()) {
					body.lyrics = lyrics;
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'miniMaxApi',
					{
						method: 'POST',
						url: 'https://api.minimax.io/v1/music_generation',
						body,
						json: true,
					},
				);

				const responseJson = responseData as IDataObject;
				const responseDataField = responseJson.data as IDataObject | undefined;
				const traceId =
					(responseJson.trace_id as string | undefined) ||
					(responseDataField?.trace_id as string | undefined);
				const rawAudio =
					responseDataField?.audio ||
					responseDataField?.audio_url ||
					(responseJson.audio as string | undefined) ||
					(responseJson.audio_url as string | undefined);
				const audioAsString = typeof rawAudio === 'string' ? rawAudio : undefined;
				const audioUrl =
					typeof audioAsString === 'string' && /^https?:\/\//i.test(audioAsString)
						? audioAsString
						: undefined;

				let audioBuffer: Buffer | undefined;
				if (returnBinary && typeof audioAsString === 'string') {
					if (audioUrl) {
						const downloadedAudio = await this.helpers.httpRequest({
							method: 'GET',
							url: audioUrl,
							encoding: 'arraybuffer',
							json: false,
						});
						audioBuffer = toBuffer(downloadedAudio);
					} else if (/^[0-9a-fA-F]+$/.test(audioAsString)) {
						audioBuffer = Buffer.from(audioAsString, 'hex');
					}
				}

				const traceSuffix = traceId || String(i + 1);
				const outputItem: INodeExecutionData = {
					json: {
						...responseJson,
						trace_id: traceId,
						audio_url: audioUrl,
					},
					pairedItem: { item: i },
				};

				if (audioBuffer && audioBuffer.length > 0) {
					const fileExtension = selectedFormat;
					outputItem.binary = {
						audio: await this.helpers.prepareBinaryData(
							audioBuffer,
							`minimax-music-${traceSuffix}.${fileExtension}`,
							getAudioMimeType(selectedFormat),
						),
					};
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
