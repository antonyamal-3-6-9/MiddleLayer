import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import * as fs from "fs";
import dotenv from 'dotenv';
dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/ .env" });
import { transferSOLToUser } from "./SolDrop";

const RPC_URL = process.env.devnet_url;
const TOKEN_MINT_ADDRESS = process.env.token_mint_address;
const treasuryWalletPath = process.env.treasury_wallet_path;
/**
 * Transfers SwapCoin from treasury wallet to a user wallet
 * @param treasuryWalletPath - Path to the treasury wallet JSON keypair
 * @param recipientAddress - User wallet address
 * @param amount - Amount of SwapCoin to transfer
 * @returns Transaction signature
 */
export async function transferFromTreasury(recipientAddress, amount) {
    const connection = new Connection(RPC_URL, "confirmed");
    // Load treasury wallet
    const secretKey = JSON.parse(fs.readFileSync(treasuryWalletPath, "utf-8"));
    const treasuryWallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
    console.log(treasuryWallet.publicKey)
    const mint = new PublicKey(TOKEN_MINT_ADDRESS);
    const recipient = new PublicKey(recipientAddress);
    // Get associated token accounts

    await transferSOLToUser(recipient, 5000)

    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(connection, treasuryWallet, mint, treasuryWallet.publicKey);
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(connection, treasuryWallet, mint, recipient);
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(treasuryTokenAccount.address, recipientTokenAccount.address, treasuryWallet.publicKey, amount * 10 ** 6 // Adjust for token decimals (e.g., 9 decimal places)
    );
    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const txSignature = await sendAndConfirmTransaction(connection, transaction, [treasuryWallet]);
    console.log("Transfer successful! Transaction Signature:", txSignature);
    return txSignature;
}
