import type { ICredentialDataDecryptedObject, ICredentialTestRequest, ICredentialType, IHttpRequestOptions, INodeProperties, Icon } from 'n8n-workflow';
export declare class MiniMaxApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: Icon;
    documentationUrl: string;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
    authenticate(credentials: ICredentialDataDecryptedObject, requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions>;
}
