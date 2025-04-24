import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
} from "@solana/spl-token";
import fs from "fs/promises"
import dotenv from 'dotenv';
dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/ .env" });

export async function transferFromTreasury(recipientAddress, amount) {
    const connection = new Connection(process.env.devnet_url, "confirmed");

    try {
        console.log("🔐 Loading treasury wallet...");
        const secretKeyRaw = await fs.readFile(process.env.treasury_wallet_path, "utf-8");
        const secretKey = JSON.parse(secretKeyRaw);
        const treasuryWallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
        console.log("Treasury Wallet:", treasuryWallet.publicKey.toBase58());

        const mint = new PublicKey(process.env.token_mint_address);
        const recipient = new PublicKey(recipientAddress);

        console.log("📦 Getting associated token accounts...");
        const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            treasuryWallet,
            mint,
            treasuryWallet.publicKey
        );

        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            treasuryWallet,
            mint,
            recipient
        );

        const adjustedAmount = amount * 10 ** 6; // Adjust if token has different decimals
        console.log(`💸 Preparing transfer of ${adjustedAmount} tokens...`);

        const transferInstruction = createTransferInstruction(
            treasuryTokenAccount.address,
            recipientTokenAccount.address,
            treasuryWallet.publicKey,
            adjustedAmount
        );

        const transaction = new Transaction().add(transferInstruction);

        console.log("🚀 Sending transaction...");
        const txSignature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [treasuryWallet]
        );

        console.log("✅ Transfer successful! Transaction Signature:", txSignature);
        return txSignature;
    } catch (error) {
        console.error("❌ Transfer failed:", error.message || error);
        throw error;
    }
}
