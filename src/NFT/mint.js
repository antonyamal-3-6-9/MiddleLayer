import {
  keypairIdentity,
  publicKey,
  generateSigner,
  none
} from '@metaplex-foundation/umi'
import dotenv from 'dotenv'
import fs from 'fs'
import { Connection, Keypair } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api'
import {
  findLeafAssetIdPda,
  mintV1,
  parseLeafFromMintV1Transaction
} from '@metaplex-foundation/mpl-bubblegum'
import bubblegum from '@metaplex-foundation/mpl-bubblegum'

dotenv.config({ path: '/home/alastor/MiddleLayer/ .env' })

const RPC_URL = process.env.devnet_url
const treasuryWalletPath = process.env.treasury_wallet_path
const merkleTreeAddress = process.env.merkle_tree_address

// Initialize Solana connection
const connection = new Connection(RPC_URL, 'confirmed')

// Load wallet keypair
const secretKey = JSON.parse(fs.readFileSync(treasuryWalletPath, 'utf-8'))
const walletSigner = Keypair.fromSecretKey(new Uint8Array(secretKey))

// Initialize Umi
const umi = createUmi(connection.rpcEndpoint)
umi.use(mplTokenMetadata())
umi.use(dasApi())
const umiUser = umi.eddsa.createKeypairFromSecretKey(walletSigner.secretKey)
umi.use(keypairIdentity(umiUser))

async function mintCompressedNFT (recipientWallet, metadata) {
  console.log('🎨 Minting Compressed NFT...')

  const merkleTreePk = publicKey(merkleTreeAddress)
  const recipientPk = publicKey(recipientWallet.publicKey)

  const { signature } = await mintV1(umi, {
    merkleTree: merkleTreePk,
    treeDelegate: publicKey(walletSigner.publicKey), // Authority of the tree
    leafOwner: recipientPk, // NFT owner
    leafDelegate: recipientPk, // Can be set to the owner or another delegate
    metadata: {
      name: metadata.name,
      uri: metadata.uri,
      symbol: metadata.symbol,
      collection: none(), // Collection must be none() unless verified
      creators: [
        {
          address: recipientPk, // 👤 User is also the creator
          share: 100,
          verified: true // ✅ Must be true for verification
        }
      ]
    }
  })
    .sign(walletSigner)
    .sign(recipientWallet)
    .sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } })

  console.log(signature)

  const txDetails = await umi.rpc.getTransaction(signature, {
    commitment: 'confirmed'
  })
  console.log('Transaction Details:', txDetails)

  console.log('✅ cNFT Minted!')

  // const leaf = await parseLeafFromMintV1Transaction(umi, signature);
  // const assetId = findLeafAssetIdPda(umi, { merkleTree, leafIndex: leaf.nonce });

  const assetId = findLeafAssetIdPda(umi, { merkleTree, leafIndex: 10 })
  console.log('🔍 Asset ID:', assetId)

  const rpcAsset = await umi.rpc.getAssetProof(assetId[0])

  console.log(rpcAsset)
}
