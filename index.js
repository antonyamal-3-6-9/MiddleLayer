import express from "express";
import { createWallet, checkTokenBalance, getWallet } from "./src/Wallet/wallet.js";
import { transferFromTreasury, } from "./src/Token/tokenCredit.js";
import { transferToTreasury } from "./src/Token/tokenTransfer.js";
import { mintNFT } from "./src/NFT/mint.js";
import { mintCompressedNFT } from "./src/NFT/merkleMint.js";
import morgan from "morgan";
import { transferSOLToUser } from "./src/Token/SolDrop.js";



const app = express();
const PORT = 3000;
app.use(express.json());
app.use(morgan("dev"));

// app.get("/wallet/initialize", async (req, res) => {
//     try {
//         const encKey = req.headers["authorization"]; // Get the key from headers
//         console.log(encKey)

//         if (!encKey) {
//             return res.status(400).json({ error: "Encryption key is required in headers" });
//         }

//         const wallet = createWallet(encKey);
//         const signature = await transferFromTreasury(wallet.publicKey, 100);

//         res.json({ wallet, signature });
//     } catch (error) {
//         res.status(500).json({ error: error.message || "Internal Server Error" });
//     }
// });

app.get("/token/reward/:publicKey/:amount", async (req, res) => {
    try {
        const publicKey = req.params.publicKey
        const signature = await transferFromTreasury(publicKey, 100);
        res.json({ "tx": signature });
    } catch (error) {
        res.status(400).json({ error: error.message || "Bad Request" });
    }
})


app.get("/wallet/balance/:publicKey", async (req, res) => {
    try {
        const balance = await checkTokenBalance(req.params.publicKey);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});


app.post("/:nft/mint/", async (req, res) => {
    console.log(req.body)
    try {
        const { publicKey, metadata } = req.body; // Correct way to extract data
        if (!publicKey || !metadata) {
            throw new Error("Missing required parameters");
        }

        let response;
        if (req.params.nft === "NFT") {
            response = await mintNFT(publicKey, metadata);
        } else if (req.params.nft === "CNFT") {
            response = await mintCompressedNFT(publicKey, metadata);
        } else {
            throw new Error("Invalid mint mode");
        }

        res.json({ "txData": response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});



app.post("/airdrop/transfer/", async (req, res) => {
    try {
        const { publicKey, amount } = req.body; // Correct way to extract data
        if (!publicKey || !amount) {
            throw new Error("Missing required parameters");
        }
        const signature = await transferSOLToUser(publicKey, amount);
        res.json({ "tx": signature });
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message || "Bad Request" });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
