import express from "express";
import { createWallet, checkTokenBalance } from "./src/Wallet/wallet.js";
import { transferFromTreasury } from "./src/Token/tokenCredit.js";


const app = express();
const PORT = 3000;

app.get("/wallet/initialize", async (req, res) => {
    try {
        const wallet = createWallet();
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
