import {
    createNft,
    fetchDigitalAsset,
    mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    Connection,
    clusterApiUrl,
    Keypair
} from "@solana/web3.js";
import {
    generateSigner,
    keypairIdentity,
    percentAmount,
    publicKey
} from "@metaplex-foundation/umi";
import fs from "fs";
import dotenv from "dotenv";
import bs58 from "bs58";

dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/ .env" });

// Load treasury wallet keypair from file
function loadWallet(walletPath) {
    try {
        const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
        return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (error) {
        throw new Error(`Failed to load wallet: ${error.message}`);
    }
}

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


export async function mintNFT(recipientPk, metadata) {
    // Load treasury wallet (signer)
    const treasuryWallet = loadWallet(process.env.treasury_wallet_path);
    console.log("🔑 Treasury Wallet:", treasuryWallet.publicKey.toBase58());

    // Create Solana connection
    const connection = new Connection(clusterApiUrl("devnet"));

    // Initialize Umi with treasury wallet as signer
    const umi = createUmi(connection.rpcEndpoint);
    umi.use(mplTokenMetadata());

    const umiTreasury = umi.eddsa.createKeypairFromSecretKey(treasuryWallet.secretKey);
    umi.use(keypairIdentity(umiTreasury));

    // Generate a new mint address for the NFT
    const nftMint = generateSigner(umi);
    console.log("🎨 Minting new NFT with address:", nftMint.publicKey);

    // Create the NFT
    const signature  = await withRetryAndTimeout(async () => {
        return createNft(umi, {
            mint: nftMint,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            sellerFeeBasisPoints: percentAmount(0),
            isCollection: false,
            authority: umiTreasury.publicKey, // Treasury is the signer
            owner: publicKey(recipientPk), // Recipient becomes the NFT owner
        }).sendAndConfirm(umi, { commitment: "finalized" });
    });

    
    console.log("✅ NFT successfully minted!");
    await new Promise(resolve => setTimeout(resolve, 5000));
    let mintedNft;
    for (let i = 0; i < 5; i++) { // Retry up to 5 times
        try {
            mintedNft = await fetchDigitalAsset(umi, nftMint.publicKey);
            break; // Exit loop if successful
        } catch (error) {
            console.log(`⏳ NFT not found yet, retrying in 3s... (${i + 1}/5)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    if (!mintedNft) throw new Error("NFT still not found after retries.");
    console.log("📦 NFT Minted:", mintedNft.mint.publicKey.toString());
    return {
        nftType: "NFT",
        mintAddress: nftMint.publicKey.toString(),
        txHash: bs58.encode(signature.signature), 
    };
}


