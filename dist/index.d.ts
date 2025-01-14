export declare function hashLeaf(pubkey: Buffer, amountLe8: Buffer): Buffer;
export declare function buildMerkleTree(leaves: Buffer[]): Buffer;
export declare function getProof(leaves: Buffer[], index: number): Buffer[];
export declare function getProofForAnchor(leaves: Buffer[], index: number): number[][];
export declare function getLeavesFromClaims(claims: Claim[]): Buffer[];
export declare function to32Bytes(pubkeyBase58: string): Buffer;
export declare function toLe8Bytes(num: number): Buffer;
export interface Claim {
    address: string;
    amount: number;
}
