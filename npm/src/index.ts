import * as crypto from "node:crypto";
import bs58 from "bs58";
import { Buffer } from "node:buffer";

function sha256(...buffers: Buffer[]): Buffer {
    const hasher = crypto.createHash("sha256");
    for (const buf of buffers) {
        hasher.update(buf);
    }
    return hasher.digest();
}

// Rust handle_claim_token:
//   node1 = sha256(pubkey + amountLE)
//   node2 = sha256([0] + node1)
export function hashLeaf(pubkey: Buffer, amountLe8: Buffer): Buffer {
    const node1 = sha256(pubkey, amountLe8);
    const node2 = sha256(Buffer.from([0]), node1); // LEAF_PREFIX = [0]
    return node2;
}


// node = sha256( [1] || (小さい方) || (大きい方) )
function hashNode(a: Buffer, b: Buffer): Buffer {
    if (Buffer.compare(a, b) <= 0) {
        return crypto.createHash("sha256")
            .update(Buffer.concat([Buffer.from([1]), a, b]))
            .digest();
    } else {
        return crypto.createHash("sha256")
            .update(Buffer.concat([Buffer.from([1]), b, a]))
            .digest();
    }
}

// buildMerkleTree (奇数leafは繰り上げ)
export function buildMerkleTree(leaves: Buffer[]): Buffer {
    if (leaves.length === 1) {
        return leaves[0];
    }
    const nextLevel: Buffer[] = [];
    for (let i = 0; i < leaves.length; i += 2) {
        if (i + 1 === leaves.length) {
            // 奇数 => 繰り上げ
            nextLevel.push(leaves[i]);
        } else {
            nextLevel.push(hashNode(leaves[i], leaves[i + 1]));
        }
    }
    return buildMerkleTree(nextLevel);
}

// getProof(奇数leafは繰り上げ)
export function getProof(leaves: Buffer[], index: number): Buffer[] {
    let currentLevel = [...leaves];
    let idx = index;
    const proof: Buffer[] = [];

    while (currentLevel.length > 1) {
        const nextLevel: Buffer[] = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            if (i + 1 === currentLevel.length) {
                // 奇数 => 繰り上げ
                nextLevel.push(currentLevel[i]);
                if (i === idx) {
                    idx = nextLevel.length - 1;
                }
            } else {
                // 2つのnode
                const left = currentLevel[i];
                const right = currentLevel[i + 1];
                const parent = hashNode(left, right);

                if (i === idx) {
                    // 自分は left => 兄弟は right
                    proof.push(right);
                    idx = nextLevel.length;
                } else if (i + 1 === idx) {
                    // 自分は right => 兄弟は left
                    proof.push(left);
                    idx = nextLevel.length;
                }
                nextLevel.push(parent);
            }
        }
        currentLevel = nextLevel;
    }
    return proof;
}

export function getProofForAnchor(leaves: Buffer[], index: number) {
    const proof = getProof(leaves, index);
    const proofForAnchor = proof.map((buf) => Array.from(buf));
    return proofForAnchor;
}

export function getLeavesFromClaims(claims: Claim[]): Buffer[] {
    return claims.map((claim) => {
        const pubkey = to32Bytes(claim.address);
        const amountLe8 = toLe8Bytes(claim.amount);
        return hashLeaf(pubkey, amountLe8);
    });
}

export function to32Bytes(pubkeyBase58: string): Buffer {
    const raw = bs58.decode(pubkeyBase58);
    if (raw.length !== 32) {
        throw new Error(`Pubkey must be 32 bytes, got ${raw.length}`);
    }
    return Buffer.from(raw); // Uint8Array を Buffer に変換
}

export function toLe8Bytes(num: number): Buffer {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(num));
    return buf;
}

export interface Claim {
    address: string;  // base58
    amount: number;
}