import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/.env" });

const RPC_URL = process.env.devnet_url;
const treasuryWalletPath = process.env.treasury_wallet_path;


export async function transferSOLToUser(userPublicKey, amountInLamports) {
    try {
        const userWallet = new PublicKey(userPublicKey);
        const connection = new Connection(RPC_URL, "confirmed");

        // Load treasury wallet
        const secretKey = JSON.parse(fs.readFileSync(treasuryWalletPath, "utf-8"));
        const treasuryWallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

        console.log("🔗 Establishing connection to Solana...");

        // Check treasury's SOL balance
        const treasuryBalance = await connection.getBalance(treasuryWallet.publicKey);
        console.log(`💰 Treasury SOL Balance: ${treasuryBalance / LAMPORTS_PER_SOL} SOL`);

        // Ensure treasury has enough SOL
        if (treasuryBalance < amountInLamports) {
            throw new Error("❌ Insufficient SOL balance in the treasury.");
        }

        // Check user's SOL balance
        const userSOLBalance = await connection.getBalance(userWallet);
        console.log(`👤 User SOL Balance: ${userSOLBalance / LAMPORTS_PER_SOL} SOL`);


        // Create transfer instruction
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: treasuryWallet.publicKey,
            toPubkey: userWallet,
            lamports: amountInLamports,
        });

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);

        // Send transaction
        console.log("🚀 Sending transaction...");
        const txSignature = await sendAndConfirmTransaction(connection, transaction, [treasuryWallet]);

        console.log("✅ SOL transfer successful! Transaction Signature:", txSignature);
        return txSignature;
    } catch (error) {
        console.error("❌ Error in transferSOLToUser:", error);
        throw new Error(`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}