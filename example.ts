import { Claim, getLeavesFromClaims, getProofForAnchor } from "./index.ts";

const claims:Claim[] = [
    {address: "GzwXKoyqgj8wNu3vkV5awXyLBQnetRG2jNct2qVa5uJi", amount: 1234}
]

console.log(getLeavesFromClaims(claims));