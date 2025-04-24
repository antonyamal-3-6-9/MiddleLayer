import {
    mplTokenMetadata,
    TokenStandard,
    transferV1
} from "@metaplex-foundation/mpl-token-metadata";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
    Connection,
    PublicKey,
    Keypair,
    clusterApiUrl
} from "@solana/web3.js";

import {
    keypairIdentity,
    publicKey,
    transactionBuilder
} from "@metaplex-foundation/umi";

import fs from "fs";
import dotenv from "dotenv";
import bs58 from "bs58";

// Load .env file
dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/.env" });

/**
 * Load a Keypair from file
 */
function loadWallet(walletPath) {
    try {
        const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
        return Keypair.fromSecretKey(new Uint8Array(secretKey));
    } catch (error) {
        throw new Error(`Failed to load wallet: ${error.messge}`);
    }
}

/**
 * Transfer an NFT (minted using UMI/Metaplex) from treasury to a recipient
 */
export async function transferNFT(
    recipientAddress,  // string (base58)
    mintAddress,
    // string (base58)
) {
    try {
        const treasuryWallet = loadWallet(process.env.treasury_wallet_path);
        console.log("🔑 Treasury Wallet:", treasuryWallet.publicKey.toBase58());

        const connection = new Connection(clusterApiUrl("devnet"));
        const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());

        const umiSender = umi.eddsa.createKeypairFromSecretKey(treasuryWallet.secretKey);
        umi.use(keypairIdentity(umiSender));

        const mint = publicKey(mintAddress);
        const recipient = publicKey(recipientAddress);

        console.log("📦 Mint:", mint.toString());
        console.log("🎯 Recipient:", recipient.toString());

        // Build transaction
        let tx = transactionBuilder();

        tx = tx.add(
            transferV1(umi, {
                mint,
                authority: umiSender,
                tokenOwner: umiSender.publicKey,
                destinationOwner: recipient,
                tokenStandard: TokenStandard.NonFungible
            })
        );

        const { signature } = await tx.sendAndConfirm(umi, { commitment: "finalized" });
        const explorerLink = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

        console.log(`✅ NFT transferred! Tx: ${explorerLink}`);
        return bs58.encode(signature)

    } catch (error) {
        console.error("❌ NFT Transfer Failed:", error);
        throw new Error(`NFT Transfer Failed: ${error.message || error}`);
    }
}
