import express from "express";
import { createWallet, checkTokenBalance, getWallet } from "./src/Wallet/wallet.js";
import { transferFromTreasury } from "./src/Token/tokenCredit.js";
import morgan from "morgan";


const app = express();
const PORT = 3000;

app.use(morgan("dev"));

app.get("/wallet/initialize", async (req, res) => {
    try {
        const encKey = req.headers["authorization"]; // Get the key from headers
        console.log(encKey)

        if (!encKey) {
            return res.status(400).json({ error: "Encryption key is required in headers" });
        }

        const wallet = createWallet(encKey);
        const signature = await transferFromTreasury(wallet.publicKey, 100);

        res.json({ wallet, signature });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.get("/wallet/balance/:publicKey", async (req, res) => {
    try {
        const balance = await checkTokenBalance(req.params.publicKey);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.post("/nft/mint", async (req, res) => {
    try {
        const { recipientPrivateKey, encKey, metadata } = req.body;
        const recipientWallet = getWallet(recipientPrivateKey, encKey);
        const { id, index } = await mintCompressedNFT(recipientWallet, metadata);
        res.json({ id, index });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
