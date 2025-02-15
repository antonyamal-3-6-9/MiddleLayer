import { createNft, fetchDigitalAsset, mplTokenMetadata, } from "@metaplex-foundation/mpl-token-metadata";
import { airdropIfRequired, getExplorerLink, } from "@solana-developers/helpers";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl, Keypair } from "@solana/web3.js";
import { generateSigner, keypairIdentity, percentAmount, } from "@metaplex-foundation/umi";
import { getWallet } from "../Wallet/wallet.js";
import dotenv from "dotenv";
dotenv.config({path: "/home/alastor/MiddleLayer/ .env"});



async function name(params) {
    
}

export async function mintNFT (key){
    const user = getWallet(key);

    console.log("🔑 Using wallet:", user.publicKey.toBase58());
    // Create Solana connection
    const connection = new Connection(clusterApiUrl("devnet"));
    await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);
    const umi = createUmi(connection.rpcEndpoint);
    umi.use(mplTokenMetadata());
    // Convert Web3 keypair to UMI keypair
    const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
    umi.use(keypairIdentity(umiUser));
    // Generate a new mint account for the NFT collection
    const collectionMint = generateSigner(umi);
    console.log("🎨 Minting new NFT collection with address:", collectionMint.publicKey);
    // Create NFT transaction
    const transaction = createNft(umi, {
        mint: collectionMint,
        name: "My Collection",
        symbol: "MC",
        uri: "https://gateway.pinata.cloud/ipfs/QmPs6YNwEnG6AcXcpAeqHtmYvovGKnxYvEY42T7ZFmQMkf",
        sellerFeeBasisPoints: percentAmount(0),
        isCollection: true,
    });
    // Send transaction
    await transaction.sendAndConfirm(umi);
    console.log("✅ NFT collection created!");
    // Fetch NFT details
    const createdCollectionNft = await fetchDigitalAsset(umi, collectionMint.publicKey);
    console.log(`📦 Collection Address: ${getExplorerLink("address", createdCollectionNft.mint.publicKey, "devnet")}`);
    //# sourceMappingURL=mint.js.map
}




console.log("🔑 Using wallet:", user.publicKey.toBase58());
// Create Solana connection
const connection = new Connection(clusterApiUrl("devnet"));
await airdropIfRequired(connection, user.publicKey, 1 * LAMPORTS_PER_SOL, 0.5 * LAMPORTS_PER_SOL);
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());
// Convert Web3 keypair to UMI keypair
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));
// Generate a new mint account for the NFT collection
const collectionMint = generateSigner(umi);
console.log("🎨 Minting new NFT collection with address:", collectionMint.publicKey);
// Create NFT transaction
const transaction = createNft(umi, {
    mint: collectionMint,
    name: "My Collection",
    symbol: "MC",
    uri: "https://gateway.pinata.cloud/ipfs/QmPs6YNwEnG6AcXcpAeqHtmYvovGKnxYvEY42T7ZFmQMkf",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
});
// Send transaction
await transaction.sendAndConfirm(umi);
console.log("✅ NFT collection created!");
// Fetch NFT details
const createdCollectionNft = await fetchDigitalAsset(umi, collectionMint.publicKey);
console.log(`📦 Collection Address: ${getExplorerLink("address", createdCollectionNft.mint.publicKey, "devnet")}`);
//# sourceMappingURL=mint.js.map