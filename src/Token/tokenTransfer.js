import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import * as fs from "fs";
import dotenv from 'dotenv';
dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/ .env" });

const RPC_URL = process.env.devnet_url;
const TOKEN_MINT_ADDRESS = process.env.token_mint_address;
const treasuryAddress = process.env.treasuryPublicKey
/**
 * Transfers SwapCoin from a user wallet to the treasury wallet
 * @param userWalletPath - Path to the user wallet JSON keypair
 * @param treasuryAddress - Treasury wallet address
 * @param amount - Amount of SwapCoin to transfer
 * @returns Transaction signature
 */
export async function transferToTreasury(userWallet, amount) {
    const connection = new Connection(RPC_URL, "confirmed");
    // Load user wallet
    const mint = new PublicKey(TOKEN_MINT_ADDRESS);
    const treasury = new PublicKey(treasuryAddress);
    // Get associated token accounts
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(connection, userWallet, mint, userWallet.publicKey);
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(connection, userWallet, mint, treasury);
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(userTokenAccount.address, treasuryTokenAccount.address, userWallet.publicKey, amount * 10 ** 9 // Adjust for token decimals
    );
    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const txSignature = await sendAndConfirmTransaction(connection, transaction, [userWallet]);
    console.log("Transfer successful! Transaction Signature:", txSignature);
    return txSignature;
}
