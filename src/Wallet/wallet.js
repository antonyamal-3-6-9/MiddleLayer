import dotenv from "dotenv";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import crypto from "crypto";

dotenv.config({path: "/home/alastor/MiddleLayer/ .env"});
const devnetUrl = process.env.devnet_url;
const TOKEN_MINT_ADDRESS = process.env.token_mint_address;
const connection = new Connection(devnetUrl, "confirmed");


// 🔐 Encrypt private key (result ≤ 100 characters)
export function encryptPrivateKey(secretKey, encKey) {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(encKey, "salt", 32);
    const iv = crypto.randomBytes(12); // GCM recommended IV size is 12 bytes
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const encrypted = Buffer.concat([cipher.update(secretKey.toString(), "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag(); // GCM requires an authentication tag

    // Concatenate IV + encrypted data + authTag, encode in Base64
    return Buffer.concat([iv, encrypted, authTag]).toString("base64").slice(0, 100);
}

// 🔓 Decrypt private key
export function decryptPrivateKey(encryptedData, encKey) {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(encKey, "salt", 32);

    const buffer = Buffer.from(encryptedData, "base64");
    const iv = buffer.subarray(0, 12); // Extract IV
    const authTag = buffer.subarray(-16); // Extract Auth Tag (last 16 bytes)
    const encryptedText = buffer.subarray(12, -16); // Extract encrypted data

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag); // Set authentication tag

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString("utf8");
}

export const createWallet = (encKey) => {
    const keypair = Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();
    const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, encKey);
    return {
        publicKey: walletAddress,
        privateKey: encryptedPrivateKey
    };
};

export function getWallet(privateKey, encKey) {
    return Keypair.fromSecretKey(decryptPrivateKey(privateKey, encKey));
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
