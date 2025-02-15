import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import * as fs from "fs";
const RPC_URL = "https://api.mainnet-beta.solana.com"; // Use a valid Solana RPC
const TOKEN_MINT_ADDRESS = "YOUR_SWAPCOIN_MINT_ADDRESS"; // Your SwapCoin mint address
/**
 * Transfers SwapCoin from a user wallet to the treasury wallet
 * @param userWalletPath - Path to the user wallet JSON keypair
 * @param treasuryAddress - Treasury wallet address
 * @param amount - Amount of SwapCoin to transfer
 * @returns Transaction signature
 */
export async function transferToTreasury(userWalletPath, treasuryAddress, amount) {
    const connection = new Connection(RPC_URL, "confirmed");
    // Load user wallet
    const secretKey = JSON.parse(fs.readFileSync(userWalletPath, "utf-8"));
    const userWallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
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
//# sourceMappingURL=tokenTransfer.js.map