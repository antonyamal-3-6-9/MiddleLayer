import express from "express";
import { createWallet, checkTokenBalance, getWallet } from "./src/Wallet/wallet.js";
import { transferFromTreasury, } from "./src/Token/tokenCredit.js";
import { transferToTreasury } from "./src/Token/tokenTransfer.js";
import { mintNFT } from "./src/NFT/mint.js";
import { mintCompressedNFT } from "./src/NFT/merkleMint.js";
import morgan from "morgan";
import { transferSOLToUser } from "./src/Token/SolDrop.js";
import { transferNFT } from "./src/NFT/transfer.js";
import dotenv from "dotenv";
dotenv.config({ path: "/media/alastor/New Volume/EcoSwapChain/ESC-BlockChain/MiddleLayer/ .env" });
import jwt from "jsonwebtoken";


const app = express();
const PORT = 3000;
app.use(express.json());
app.use(morgan("dev"));

// In Node.js, modify the secret handling:
const JWT_SECRET = Buffer.from(process.env.JWT_SECRET.trim(), 'utf8');  // Try utf8 instead of hex


app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);

    console.log("JWT_SECRET length (Node):", JWT_SECRET.length);

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' });
        req.user = decoded.client
        next();
    } catch(error) {
        console.log(error)
        res.status(403).json({ error: 'Invalid token', error: error.message });
    }
});

app.get('/ping/', (req, res) => {
    res.json({ message: 'Verified access', user: req.user });
});


app.get("/token/reward/:publicKey/:amount", async (req, res) => {
    try {
        const publicKey = req.params.publicKey
        const signature = await transferFromTreasury(publicKey, 100);
        res.json({ "tx": signature });
    } catch (error) {
        res.status(400).json({ error: error.message || "Bad Request" });
    }
})

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
