import { keypairIdentity, publicKey, generateSigner, none } from "@metaplex-foundation/umi";
import dotenv from "dotenv";
import fs from "fs";
import { Connection, Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import {
    findLeafAssetIdPda,
    mintV1,
    mplBubblegum,
    parseLeafFromMintV1Transaction,
} from "@metaplex-foundation/mpl-bubblegum";
import bubblegum from "@metaplex-foundation/mpl-bubblegum";


// Load environment variables
dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/ .env" });

const RPC_URL = "https://devnet.helius-rpc.com/?api-key=a0d5aa96-2efc-4218-8d10-522b72252623";
const treasuryWalletPath = process.env.treasury_wallet_path;

// Initialize Solana connection with timeout
const connection = new Connection(RPC_URL, {
    commitment: "confirmed",
    timeout: 60000,
});

// Load wallet keypair
const secretKey = JSON.parse(fs.readFileSync(treasuryWalletPath, "utf-8"));
const walletSigner = Keypair.fromSecretKey(new Uint8Array(secretKey));

// Initialize Umi
const umi = createUmi(connection.rpcEndpoint)
    .use(mplTokenMetadata())
    .use(mplBubblegum())
    .use(dasApi());

const umiUser = umi.eddsa.createKeypairFromSecretKey(walletSigner.secretKey);
umi.use(keypairIdentity(umiUser));

// Retry utility function
async function withRetryAndTimeout(fn, retries = 3, delay = 1000, timeout = 30000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await Promise.race([
                fn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
                )
            ]);
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Retrying (${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function mintCompressedNFT(merkleTree, recipient, metadata) {
    console.log("🎨 Minting Compressed NFT...");

    try {
        const merkleTreePk = publicKey(merkleTree);
        const recipientPk = publicKey(recipient);

        // Mint transaction with retry logic
        const { signature } = await withRetryAndTimeout(async () => {
            return mintV1(umi, {
                merkleTree: merkleTreePk,
                treeDelegate: umi.identity.publicKey,
                leafOwner: recipientPk,
                leafDelegate: recipientPk,
                metadata: {
                    name: metadata.name,
                    uri: metadata.uri,
                    collection: none(),
                    creators: metadata.creators.map(creator => ({
                        address: publicKey(creator.address),
                        share: creator.share,
                        verified: creator.verified,
                    })),
                },
            }).sendAndConfirm(umi);
        });

        console.log("⏳ Transaction Signature:", signature);

        // Confirmation with retry logic
        await withRetryAndTimeout(async () => {
            return umi.rpc.confirmTransaction(signature, {
                strategy: { type: 'blockhash' },
                commitment: 'finalized'
            });
        }, 5, 2000, 45000);

        console.log("✅ Transaction Confirmed!");


        // Parse leaf information
        const leaf = await parseLeafFromMintV1Transaction(umi, signature);
        console.log("🍃 Leaf Details:", leaf);

        // Get asset ID
        const assetId = findLeafAssetIdPda(umi, {
            merkleTree: merkleTreePk,
            leafIndex: leaf.nonce
        });
        console.log("🆔 Asset ID:", assetId);

        // Get asset proof with retry
        const assetProof = await withRetryAndTimeout(async () => {
            return umi.rpc.getAssetProof(assetId[0]);
        });

        console.log("🔗 Asset Proof:", assetProof);
        return assetId;

    } catch (error) {
        console.error("❌ Error minting NFT:", error);
        throw error;
    }
}

// Execute mint with error handling
(async () => {
    try {
        await mintCompressedNFT(
            "4KwoD26wgRU9dg7VX2QdUHkkZRiD9QeLppVfWXYayRQE",
            "F9xqJ3gWLKpZyPJGx7hVUwFh1eh9eM9JcZ2nQqQk9rMw",
            {
                name: "Cool NFT",
                uri: "https://example.com/metadata.json",
                creators: [{
                    address: "3t8PnT6TKL9t7KX3MqWXxJ8wDYXaU5zKqZHtYPQmdjMb",
                    share: 100,
                    verified: false,
                }],
            }
        );
    } catch (error) {
        console.error("💥 Fatal error in mint process:", error);
        process.exit(1);
    }
})();