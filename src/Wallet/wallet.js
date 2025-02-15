import dotenv from "dotenv";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import crypto from "crypto";

dotenv.config({path: "/home/alastor/MiddleLayer/ .env"});
const devnetUrl = process.env.devnet_url;
const TOKEN_MINT_ADDRESS = process.env.token_mint_address;
console.log("Running")
console.log(devnetUrl, TOKEN_MINT_ADDRESS);
const connection = new Connection(devnetUrl, "confirmed");

export function encryptPrivateKey(secretKey) {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || "default_key", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(secretKey.toString()), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}
// 🔓 Decrypt private key when needed
export function decryptPrivateKey(encryptedData) {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || "default_key", "salt", 32);
    const [ivHex, encryptedText] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedText, "hex")), decipher.final()]);
    return new Uint8Array(decrypted.toString().split(",").map(Number));
}
export const createWallet = () => {
    const keypair = Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();
    const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey);
    return {
        publicKey: walletAddress,
        privateKey: encryptedPrivateKey
    };
};

export function getWallet(privateKey) {
    return decryptPrivateKey(privateKey);
}

export async function checkTokenBalance(wallet) {
    try {
        const walletPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
        // Get the associated token account (ATA) for the wallet
        const tokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey);
        
        // Fetch token account info
        console.log("Token Account in Balance Check:", tokenAccountAddress.toBase58());

        const decimals = 6; // Your token's decimal places
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        const balance = Number(tokenAccount.amount) / 10 ** decimals;
        
        console.log("Token Balance:", balance);
        return balance
    }
    catch (error) {
        console.error("Error checking token balance:", error);
    }
}
