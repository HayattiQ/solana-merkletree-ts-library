"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashLeaf = hashLeaf;
exports.buildMerkleTree = buildMerkleTree;
exports.getProof = getProof;
exports.getProofForAnchor = getProofForAnchor;
exports.getLeavesFromClaims = getLeavesFromClaims;
exports.to32Bytes = to32Bytes;
exports.toLe8Bytes = toLe8Bytes;
const crypto = __importStar(require("crypto"));
const bs58_1 = __importDefault(require("bs58"));
function sha256(...buffers) {
    const hasher = crypto.createHash("sha256");
    for (const buf of buffers) {
        hasher.update(buf);
    }
    return hasher.digest();
}
// Rust handle_claim_token:
//   node1 = sha256(pubkey + amountLE)
//   node2 = sha256([0] + node1)
function hashLeaf(pubkey, amountLe8) {
    const node1 = sha256(pubkey, amountLe8);
    const node2 = sha256(Buffer.from([0]), node1); // LEAF_PREFIX = [0]
    return node2;
}
// node = sha256( [1] || (小さい方) || (大きい方) )
function hashNode(a, b) {
    if (Buffer.compare(a, b) <= 0) {
        return crypto.createHash("sha256")
            .update(Buffer.concat([Buffer.from([1]), a, b]))
            .digest();
    }
    else {
        return crypto.createHash("sha256")
            .update(Buffer.concat([Buffer.from([1]), b, a]))
            .digest();
    }
}
// buildMerkleTree (奇数leafは繰り上げ)
function buildMerkleTree(leaves) {
    if (leaves.length === 1) {
        return leaves[0];
    }
    const nextLevel = [];
    for (let i = 0; i < leaves.length; i += 2) {
        if (i + 1 === leaves.length) {
            // 奇数 => 繰り上げ
            nextLevel.push(leaves[i]);
        }
        else {
            nextLevel.push(hashNode(leaves[i], leaves[i + 1]));
        }
    }
    return buildMerkleTree(nextLevel);
}
// getProof(奇数leafは繰り上げ)
function getProof(leaves, index) {
    let currentLevel = [...leaves];
    let idx = index;
    const proof = [];
    while (currentLevel.length > 1) {
        const nextLevel = [];
        for (let i = 0; i < currentLevel.length; i += 2) {
            if (i + 1 === currentLevel.length) {
                // 奇数 => 繰り上げ
                nextLevel.push(currentLevel[i]);
                if (i === idx) {
                    idx = nextLevel.length - 1;
                }
            }
            else {
                // 2つのnode
                const left = currentLevel[i];
                const right = currentLevel[i + 1];
                const parent = hashNode(left, right);
                if (i === idx) {
                    // 自分は left => 兄弟は right
                    proof.push(right);
                    idx = nextLevel.length;
                }
                else if (i + 1 === idx) {
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
function getProofForAnchor(leaves, index) {
    const proof = getProof(leaves, index);
    const proofForAnchor = proof.map((buf) => Array.from(buf));
    return proofForAnchor;
}
function getLeavesFromClaims(claims) {
    return claims.map((claim) => {
        const pubkey = to32Bytes(claim.address);
        const amountLe8 = toLe8Bytes(claim.amount);
        return hashLeaf(pubkey, amountLe8);
    });
}
function to32Bytes(pubkeyBase58) {
    const raw = bs58_1.default.decode(pubkeyBase58);
    if (raw.length !== 32) {
        throw new Error(`Pubkey must be 32 bytes, got ${raw.length}`);
    }
    return Buffer.from(raw); // Uint8Array を Buffer に変換
}
function toLe8Bytes(num) {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(num));
    return buf;
}
