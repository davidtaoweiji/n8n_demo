import type { INodeType, INodeTypeDescription, ISupplyDataFunctions } from 'n8n-workflow';
export declare class MiniMaxChatModel implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<import("n8n-workflow").SupplyData>;
}
