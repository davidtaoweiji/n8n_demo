"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniMaxApi = void 0;
class MiniMaxApi {
    constructor() {
        this.name = 'miniMaxApi';
        this.displayName = 'MiniMax API';
        this.icon = {
            light: 'file:../icons/minimax.svg',
            dark: 'file:../icons/minimax.dark.svg',
        };
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                required: true,
                default: '',
                description: 'The API Key from MiniMax console',
            },
        ];
        this.test = {
            request: {
                baseURL: 'https://api.minimaxi.com',
                url: '/v1/text/chatcompletion_v2',
                method: 'POST',
                body: JSON.stringify({
                    model: 'M2-her',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 1,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer {{$credentials.apiKey}}',
                },
            },
        };
    }
    async authenticate(credentials, requestOptions) {
        var _a;
        (_a = requestOptions.headers) !== null && _a !== void 0 ? _a : (requestOptions.headers = {});
        requestOptions.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
        return requestOptions;
    }
}
exports.MiniMaxApi = MiniMaxApi;
//# sourceMappingURL=MiniMaxApi.credentials.js.map