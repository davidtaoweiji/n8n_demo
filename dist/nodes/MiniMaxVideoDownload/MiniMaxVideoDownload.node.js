"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxVideoDownload = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const toBuffer = (value) => {
    if (Buffer.isBuffer(value))
        return value;
    if (value instanceof ArrayBuffer)
        return Buffer.from(value);
    return undefined;
};
class MiniMaxVideoDownload {
    constructor() {
        this.description = {
            displayName: 'MiniMax Video: Download',
            name: 'miniMaxVideoDownload',
            icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Retrieve the download URL (and optionally binary data) for a generated MiniMax video using its file_id.',
            usableAsTool: true,
            defaults: {
                name: 'MiniMax Video: Download',
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
                    description: 'Whether to download the video and return it as binary data on property "video". If false, only the download URL is returned in JSON.',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const fileId = this.getNodeParameter('fileId', i);
                const returnBinary = this.getNodeParameter('returnBinary', i, true);
                if (!fileId || !fileId.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'File ID is required.', { itemIndex: i });
                }
                const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'miniMaxApi', {
                    method: 'GET',
                    url: 'https://api.minimax.io/v1/files/retrieve',
                    qs: { file_id: fileId },
                    json: true,
                });
                const responseJson = responseData;
                const fileInfo = responseJson.file;
                const downloadUrl = fileInfo === null || fileInfo === void 0 ? void 0 : fileInfo.download_url;
                const outputItem = {
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
                        const filename = (fileInfo === null || fileInfo === void 0 ? void 0 : fileInfo.filename) || `minimax-video-${fileId}.mp4`;
                        outputItem.binary = {
                            video: await this.helpers.prepareBinaryData(videoBuffer, filename, 'video/mp4'),
                        };
                    }
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
exports.MiniMaxVideoDownload = MiniMaxVideoDownload;
//# sourceMappingURL=MiniMaxVideoDownload.node.js.map