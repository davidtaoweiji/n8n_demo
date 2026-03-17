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
		case 'pcm':
			return 'audio/L16';
		case 'flac':
			return 'audio/flac';
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

export class MiniMaxTts implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MiniMax TTS',
		name: 'miniMaxTts',
		icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Convert text to speech with MiniMax TTS API',
		usableAsTool: true,
		defaults: {
			name: 'MiniMax TTS',
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
				default: 'speech-2.8-hd',
				description: 'TTS model used to synthesize speech',
				options: [
					{
						name: 'speech-2.8-hd',
						value: 'speech-2.8-hd',
					},
				],
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Text to convert to speech. If empty, it will be read from upstream JSON (text, output, response, or content).',
			},
			{
				displayName: 'Stream',
				name: 'stream',
				type: 'boolean',
				default: false,
				description: 'Whether to enable streaming response',
			},
			{
				displayName: 'Voice ID',
				name: 'voiceId',
				type: 'string',
				default: 'male-qn-qingse',
				description: 'Voice preset ID for synthesis',
			},
			{
				displayName: 'Voice Settings',
				name: 'voiceSettings',
				type: 'collection',
				placeholder: 'Add Voice Setting',
				default: {},
				options: [
					{
						displayName: 'Speed',
						name: 'speed',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 0.5, maxValue: 2, numberPrecision: 2 },
						description: 'Speech speed',
					},
					{
						displayName: 'Volume',
						name: 'vol',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 0, maxValue: 10, numberPrecision: 2 },
						description: 'Output volume',
					},
					{
						displayName: 'Pitch',
						name: 'pitch',
						type: 'number',
						default: 0,
						typeOptions: { minValue: -12, maxValue: 12, numberPrecision: 2 },
						description: 'Pitch shift value',
					},
					{
						displayName: 'Emotion',
						name: 'emotion',
						type: 'string',
						default: 'happy',
						description: 'Voice emotion hint',
					},
				],
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
						default: 32000,
						typeOptions: { minValue: 8000, maxValue: 48000, numberPrecision: 0 },
						description: 'Audio sample rate',
					},
					{
						displayName: 'Bitrate',
						name: 'bitrate',
						type: 'number',
						default: 128000,
						typeOptions: { minValue: 16000, maxValue: 320000, numberPrecision: 0 },
						description: 'Audio bitrate',
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
							{
								name: 'PCM',
								value: 'pcm',
							},
						],
					},
					{
						displayName: 'Channel',
						name: 'channel',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 1, maxValue: 2, numberPrecision: 0 },
						description: 'Number of audio channels',
					},
				],
			},
			{
				displayName: 'Pronunciation Tone List',
				name: 'pronunciationTone',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description:
					'Optional tone dictionary entries, one per line, for example: process/(chu3)(li3)',
			},
			{
				displayName: 'Subtitle Enable',
				name: 'subtitleEnable',
				type: 'boolean',
				default: false,
				description: 'Whether to include subtitle data in response',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: 'url',
				description: 'Audio output format for non-streaming mode',
				options: [
					{
						name: 'URL',
						value: 'url',
					},
					{
						name: 'HEX',
						value: 'hex',
					},
				],
				displayOptions: {
					show: {
						stream: [false],
					},
				},
			},
			{
				displayName: 'Return Binary',
				name: 'returnBinary',
				type: 'boolean',
				default: true,
				description: 'Whether to return audio as binary data on property "audio"',
				displayOptions: {
					show: {
						stream: [false],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const model = this.getNodeParameter('model', i) as string;
				const inputText = this.getNodeParameter('text', i, '') as string;
				const itemJson = items[i].json as IDataObject;
				const resolvedText =
					inputText ||
					(itemJson.text as string | undefined) ||
					(itemJson.output as string | undefined) ||
					(itemJson.response as string | undefined) ||
					(itemJson.content as string | undefined) ||
					'';

				if (!resolvedText || !resolvedText.trim()) {
					throw new NodeOperationError(
						this.getNode(),
						'Text is required. Provide Text or pass text in input JSON via text/output/response/content.',
						{ itemIndex: i },
					);
				}

				const stream = this.getNodeParameter('stream', i) as boolean;
				const voiceId = this.getNodeParameter('voiceId', i) as string;
				const voiceSettings = this.getNodeParameter('voiceSettings', i, {}) as IDataObject;
				const audioSettings = this.getNodeParameter('audioSettings', i, {}) as IDataObject;
				const pronunciationTone = this.getNodeParameter('pronunciationTone', i, '') as string;
				const subtitleEnable = this.getNodeParameter('subtitleEnable', i) as boolean;
				const outputFormat = this.getNodeParameter('outputFormat', i, 'url') as string;
				const returnBinary = this.getNodeParameter('returnBinary', i, true) as boolean;

				const toneList = pronunciationTone
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				const body: IDataObject = {
					model,
					text: resolvedText,
					stream,
					voice_setting: {
						voice_id: voiceId,
						speed: (voiceSettings.speed as number | undefined) ?? 1,
						vol: (voiceSettings.vol as number | undefined) ?? 1,
						pitch: (voiceSettings.pitch as number | undefined) ?? 0,
						emotion: (voiceSettings.emotion as string | undefined) ?? 'happy',
					},
					audio_setting: {
						sample_rate: (audioSettings.sampleRate as number | undefined) ?? 32000,
						bitrate: (audioSettings.bitrate as number | undefined) ?? 128000,
						format: (audioSettings.format as string | undefined) ?? 'mp3',
						channel: (audioSettings.channel as number | undefined) ?? 1,
					},
					subtitle_enable: subtitleEnable,
				};

				if (!stream) {
					body.output_format = outputFormat;
				}

				if (toneList.length > 0) {
					body.pronunciation_dict = {
						tone: toneList,
					};
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'miniMaxApi',
					{
						method: 'POST',
						url: 'https://api.minimaxi.com/v1/t2a_v2',
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
				if (!stream && returnBinary && typeof audioAsString === 'string') {
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

				const outputItem: INodeExecutionData = {
					json: {
						...responseJson,
						trace_id: traceId,
						audio_url: audioUrl,
					},
					pairedItem: { item: i },
				};

				if (audioBuffer && audioBuffer.length > 0) {
					const selectedFormat =
						((audioSettings.format as string | undefined) || 'mp3').toLowerCase();
					const fileExtension = selectedFormat === 'pcm' ? 'pcm' : selectedFormat;
					const traceSuffix = traceId || String(i + 1);
					outputItem.binary = {
						audio: await this.helpers.prepareBinaryData(
							audioBuffer,
							`minimax-tts-${traceSuffix}.${fileExtension}`,
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
