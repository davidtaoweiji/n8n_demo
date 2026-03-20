"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxTts = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const getAudioMimeType = (format) => {
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
const toBuffer = (value) => {
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
class MiniMaxTts {
    constructor() {
        this.description = {
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
                    description: 'Optional tone dictionary entries, one per line, for example: process/(chu3)(li3)',
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
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const model = this.getNodeParameter('model', i);
                const inputText = this.getNodeParameter('text', i, '');
                const itemJson = items[i].json;
                const resolvedText = inputText ||
                    itemJson.text ||
                    itemJson.output ||
                    itemJson.response ||
                    itemJson.content ||
                    '';
                if (!resolvedText || !resolvedText.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Text is required. Provide Text or pass text in input JSON via text/output/response/content.', { itemIndex: i });
                }
                const stream = this.getNodeParameter('stream', i);
                const voiceId = this.getNodeParameter('voiceId', i);
                const voiceSettings = this.getNodeParameter('voiceSettings', i, {});
                const audioSettings = this.getNodeParameter('audioSettings', i, {});
                const pronunciationTone = this.getNodeParameter('pronunciationTone', i, '');
                const subtitleEnable = this.getNodeParameter('subtitleEnable', i);
                const outputFormat = this.getNodeParameter('outputFormat', i, 'url');
                const returnBinary = this.getNodeParameter('returnBinary', i, true);
                const toneList = pronunciationTone
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);
                const body = {
                    model,
                    text: resolvedText,
                    stream,
                    voice_setting: {
                        voice_id: voiceId,
                        speed: (_a = voiceSettings.speed) !== null && _a !== void 0 ? _a : 1,
                        vol: (_b = voiceSettings.vol) !== null && _b !== void 0 ? _b : 1,
                        pitch: (_c = voiceSettings.pitch) !== null && _c !== void 0 ? _c : 0,
                        emotion: (_d = voiceSettings.emotion) !== null && _d !== void 0 ? _d : 'happy',
                    },
                    audio_setting: {
                        sample_rate: (_e = audioSettings.sampleRate) !== null && _e !== void 0 ? _e : 32000,
                        bitrate: (_f = audioSettings.bitrate) !== null && _f !== void 0 ? _f : 128000,
                        format: (_g = audioSettings.format) !== null && _g !== void 0 ? _g : 'mp3',
                        channel: (_h = audioSettings.channel) !== null && _h !== void 0 ? _h : 1,
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
                const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'miniMaxApi', {
                    method: 'POST',
                    url: 'https://api.minimax.io/v1/t2a_v2',
                    body,
                    json: true,
                });
                const responseJson = responseData;
                const responseDataField = responseJson.data;
                const traceId = responseJson.trace_id ||
                    (responseDataField === null || responseDataField === void 0 ? void 0 : responseDataField.trace_id);
                const rawAudio = (responseDataField === null || responseDataField === void 0 ? void 0 : responseDataField.audio) ||
                    (responseDataField === null || responseDataField === void 0 ? void 0 : responseDataField.audio_url) ||
                    responseJson.audio ||
                    responseJson.audio_url;
                const audioAsString = typeof rawAudio === 'string' ? rawAudio : undefined;
                const audioUrl = typeof audioAsString === 'string' && /^https?:\/\//i.test(audioAsString)
                    ? audioAsString
                    : undefined;
                let audioBuffer;
                if (!stream && returnBinary && typeof audioAsString === 'string') {
                    if (audioUrl) {
                        const downloadedAudio = await this.helpers.httpRequest({
                            method: 'GET',
                            url: audioUrl,
                            encoding: 'arraybuffer',
                            json: false,
                        });
                        audioBuffer = toBuffer(downloadedAudio);
                    }
                    else if (/^[0-9a-fA-F]+$/.test(audioAsString)) {
                        audioBuffer = Buffer.from(audioAsString, 'hex');
                    }
                }
                delete responseJson.audio;
                delete responseJson.audio_url;
                (_j = responseJson.data) === null || _j === void 0 ? true : delete _j.audio;
                (_k = responseJson.data) === null || _k === void 0 ? true : delete _k.audio_url;
                const outputItem = {
                    json: {
                        ...responseJson,
                        trace_id: traceId,
                    },
                    pairedItem: { item: i },
                };
                if (audioBuffer && audioBuffer.length > 0) {
                    const selectedFormat = (audioSettings.format || 'mp3').toLowerCase();
                    const fileExtension = selectedFormat === 'pcm' ? 'pcm' : selectedFormat;
                    const traceSuffix = traceId || String(i + 1);
                    outputItem.binary = {
                        audio: await this.helpers.prepareBinaryData(audioBuffer, `minimax-tts-${traceSuffix}.${fileExtension}`, getAudioMimeType(selectedFormat)),
                    };
                }
                returnData.push(outputItem);
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
exports.MiniMaxTts = MiniMaxTts;
//# sourceMappingURL=MiniMaxTts.node.js.map