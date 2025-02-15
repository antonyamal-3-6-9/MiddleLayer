import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree } from '@metaplex-foundation/mpl-bubblegum';
import { generateSigner, percentAmount, publicKey, keypairIdentity } from '@metaplex-foundation/umi';
import dotenv from 'dotenv';
import fs from 'fs';
import { Keypair, Connection } from '@solana/web3.js';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';

// Load environment variables
dotenv.config({path: "/home/alastor/MiddleLayer/ .env"});

const RPC_URL = 'https://api.devnet.solana.com';
const treasuryWalletPath = process.env.treasury_wallet_path;

const connection = new Connection(RPC_URL, 'confirmed'); 

// Load wallet keypair
const secretKey = JSON.parse(fs.readFileSync(treasuryWalletPath, 'utf-8'));
const walletSigner = Keypair.fromSecretKey(new Uint8Array(secretKey));

// Initialize Umi
const umi = createUmi(connection.rpcEndpoint)

umi.use(mplTokenMetadata());
// Convert Web3 keypair to UMI keypair
const umiUser = umi.eddsa.createKeypairFromSecretKey(walletSigner.secretKey);

umi.use(keypairIdentity(umiUser));



async function createMerkleTree() {
    console.log('🌳 Creating a Merkle Tree for cNFTs...');

    // Generate a new Merkle tree keypair
    const merkleTree = generateSigner(umi);

    // Define tree parameters
    const maxDepth = 14;
    const maxBufferSize = 64;

    // Create tree transaction
    const createTreeTx = await createTree(umi, {
        merkleTree,
        authority: walletSigner.publicKey,
        maxDepth,
        maxBufferSize,
        canopyDepth: maxDepth - 5, // Optimized read operations
        feePayer: walletSigner.publicKey,
        rentPayer: walletSigner.publicKey,
      });
      
      // Send and confirm transaction
      await createTreeTx
      .sendAndConfirm(umi)
      .then(() => {
        console.log("✅ Merkle Tree Created!");
        console.log("📍 Public Key:", merkleTree.publicKey.toString());
      })

    // Save Merkle tree keypair to a JSON file
    const outputPath = 'merkle_tree_keys.json';
    fs.writeFileSync(
        outputPath,
        JSON.stringify({
            publicKey: merkleTree.publicKey.toString(),
            secretKey: Array.from(merkleTree.secretKey),
        }, null, 2)
    );

    console.log(`🔐 Merkle Tree Keys saved to: ${outputPath}`);
}

createMerkleTree().catch(console.error);
