import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class MiniMaxApi implements ICredentialType {
	name = 'miniMaxApi';

	displayName = 'MiniMax API';

	icon: Icon = {
		light: 'file:../icons/minimax.svg',
		dark: 'file:../icons/minimax.dark.svg',
	};

	documentationUrl = 'https://platform.minimax.io';

	properties: INodeProperties[] = [
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

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.minimax.io',
			url: '/v1/text/chatcompletion_v2',
			method: 'POST',
			body: JSON.stringify({
				model: 'MiniMax-M2.5',
				messages: [{ role: 'user', content: 'Hello' }],
				max_tokens: 1,
			}),
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer {{$credentials.apiKey}}',
			},
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		requestOptions.headers ??= {};

		requestOptions.headers['Authorization'] = `Bearer ${credentials.apiKey}`;

		return requestOptions;
	}
}
