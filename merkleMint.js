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
import { base64 } from "@metaplex-foundation/umi/serializers";

const { getAsset } = bubblegum;







// Load environment variables
dotenv.config({ path: "/home/alastor/MiddleLayer/ .env" });

const RPC_URL = "https://devnet.helius-rpc.com/";
const treasuryWalletPath = process.env.treasury_wallet_path;

// Initialize Solana connection
const connection = new Connection(RPC_URL, "confirmed");

// Load wallet keypair
const secretKey = JSON.parse(fs.readFileSync(treasuryWalletPath, "utf-8"));
const walletSigner = Keypair.fromSecretKey(new Uint8Array(secretKey));

// Initialize Umi
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());
umi.use(mplBubblegum());
umi.use(dasApi());


const umiUser = umi.eddsa.createKeypairFromSecretKey(walletSigner.secretKey);
umi.use(keypairIdentity(umiUser));



async function extractLeafIndexFromLogs(logs) {
    const returnLog = logs.find(log => log.startsWith("Program return:"));
    if (!returnLog) throw new Error("Leaf index log not found");

    // Extract the Base64-encoded part
    const base64Data = returnLog.split(" ")[2];
    const decoded = base64.deserialize(Buffer.from(base64Data, "base64"));

    console.log("Decoded Log:", decoded);
    return decoded;
}


async function mintCompressedNFT(merkleTree, recipient, metadata) {
    console.log("🎨 Minting Compressed NFT...");

    // Convert addresses to PublicKey format
    const merkleTreePk = publicKey(merkleTree);
    const recipientPk = publicKey(recipient);

    const { signature } = await mintV1(umi, {
        merkleTree: merkleTreePk,
        treeDelegate: publicKey(walletSigner.publicKey), // Authority of the tree
        leafOwner: recipientPk, // NFT owner
        leafDelegate: recipientPk, // Can be set to the owner or another delegate
        metadata: {
            name: metadata.name,
            uri: metadata.uri,
            collection: none(), // Collection must be none() unless verified
            creators: metadata.creators.map((creator) => ({
                address: publicKey(creator.address), // Ensure it's a PublicKey
                share: creator.share,
                verified: creator.verified,
            })),
        },
    }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

    
    console.log(signature)

    // await umi.rpc.confirmTransaction(signature, { commitment: 'finalized' });

    // const txDetails = await umi.rpc.getTransaction(signature, {
    //     commitment: "confirmed",
    //   });
    //   console.log("Transaction Details:", txDetails);
      

    // const leafIndexData = await extractLeafIndexFromLogs(txDetails.meta.logs);
    // console.log(leafIndexData)
    // console.log("✅ cNFT Minted!");

    const leaf = await  parseLeafFromMintV1Transaction(umi, signature);
    console.log("🔍 Leaf:", leaf);
    const assetId = findLeafAssetIdPda(umi, { merkleTree, leafIndex: leaf.nonce });
    console.log("🔍 Asset ID:", assetId);

    const rpcAsset = await umi.rpc.getAssetProof(assetId[0])

    console.log(rpcAsset)

}

// Call the function with corrected values
await mintCompressedNFT(
    "3h6DCegRWQhKdyG6WAm6odxEZDkWoGcT49uh8G4dWsYw", // Merkle Tree Public Key
    "F9xqJ3gWLKpZyPJGx7hVUwFh1eh9eM9JcZ2nQqQk9rMw", // Recipient Public Key
    {
        name: "Cool NFT",
        uri: "https://example.com/metadata.json",
        creators: [
            {
                address: "3t8PnT6TKL9t7KX3MqWXxJ8wDYXaU5zKqZHtYPQmdjMb",
                share: 100,
                verified: false,
            },
        ],
    }
);
