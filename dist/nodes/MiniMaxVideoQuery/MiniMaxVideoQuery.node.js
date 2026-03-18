"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxVideoQuery = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MiniMaxVideoQuery {
    constructor() {
        this.description = {
            displayName: 'MiniMax Video: Query Task',
            name: 'miniMaxVideoQuery',
            icon: { light: 'file:../../icons/minimax.svg', dark: 'file:../../icons/minimax.dark.svg' },
            group: ['transform'],
            version: 1,
            description: 'Query the status of a MiniMax video generation task. Returns task_id, status, and file_id on success.',
            usableAsTool: true,
            defaults: {
                name: 'MiniMax Video: Query Task',
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
                    displayName: 'Task ID',
                    name: 'taskId',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'The task ID returned from a video generation request',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const taskId = this.getNodeParameter('taskId', i);
                if (!taskId || !taskId.trim()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Task ID is required.', { itemIndex: i });
                }
                const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'miniMaxApi', {
                    method: 'GET',
                    url: 'https://api.minimax.io/v1/query/video_generation',
                    qs: { task_id: taskId },
                    json: true,
                });
                returnData.push({
                    json: responseData,
                    pairedItem: { item: i },
                });
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
exports.MiniMaxVideoQuery = MiniMaxVideoQuery;
//# sourceMappingURL=MiniMaxVideoQuery.node.js.map