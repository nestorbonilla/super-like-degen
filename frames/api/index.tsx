import {
  Frog,
  Button,
  TextInput,
  getFarcasterUserDetails,
  validateFramesMessage,
  parseEther,
} from "@airstack/frog"
import { http, createPublicClient } from "viem"
import { devtools } from "@airstack/frog/dev"
import { serveStatic } from "@airstack/frog/serve-static"
import { handle } from "@airstack/frog/vercel"
import { config } from "dotenv"
import { base, baseSepolia } from "viem/chains"
import { Address, toHex } from "viem"
import { degenAbi } from "../abi/degen.js"
import { tokenAbi } from "../abi/erc20.js"
import { superLikeAbi } from "../abi/superLike.js"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk"
import { createSystem } from "@airstack/frog/ui"

const { Image } = createSystem()

config()

// MAINNET
// const DEGEN_BASE_MAINNET_CONTRACT = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
// const SUPER_LIKE_BASE_MAINNET_CONTRACT = ""
const ADD_URL_PROD =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=SuperLike&icon=flame&postUrl=https%3A%2F%2Fdegenway.vercel.app%2Fapi%2Fsuperlike"

// SEPOLIA
const DEGEN_BASE_SEPOLIA_CONTRACT = "0x6Df63D498E27B860a58a441D8AA7ea54338830F8"
const SUPER_LIKE_BASE_SEPOLIA_CONTRACT =
  "0x84Ec3C369d8d327c6B37AF11C1c4BD6007f91a96"
const ADD_URL_TEST =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=SuperLike&icon=flame&postUrl=https%3A%2F%2Fcead-2607-fb91-3ac-d81e-7c79-32e-fb6f-286d.ngrok-free.app%2Fapi%2Fsuperlike"

export const app = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  basePath: "/api",
  browserLocation: ADD_URL_PROD,
})

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

app.frame("/", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        <Image src="/frame_0.png" />
      </div>
    ),
    intents: [
      <Button.AddCastAction action="/superlike">Add</Button.AddCastAction>,
    ],
  })
})

app.castAction(
  "/superlike",
  async (c) => {
    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!)
    let userAddress = await client
      .fetchBulkUsers([c.actionData.fid])
      .then(
        (res) => res.users[0].verified_addresses.eth_addresses[0] as Address
      )
    const allowance = await publicClient.readContract({
      address: DEGEN_BASE_SEPOLIA_CONTRACT,
      abi: degenAbi,
      functionName: "allowance",
      args: [userAddress, SUPER_LIKE_BASE_SEPOLIA_CONTRACT],
    })

    if (allowance >= parseEther("100")) {
      return c.frame({ path: "/like-frame" })
    } else {
      return c.frame({ path: "/allowance-frame" })
    }
  },
  { name: "SuperLike Degen", icon: "flame" }
)

app.frame("/allowance-frame", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        <Image src="/frame_0.png" />
      </div>
    ),
    intents: [
      <Button.Transaction target="/allowance-action">
        Approve
      </Button.Transaction>,
    ],
    action: "/like-frame",
  })
})

app.transaction("/allowance-action", (c) => {
  return c.contract({
    abi: tokenAbi,
    chainId: `eip155:${baseSepolia.id}`,
    functionName: "approve",
    args: [SUPER_LIKE_BASE_SEPOLIA_CONTRACT, parseEther("10000")],
    to: DEGEN_BASE_SEPOLIA_CONTRACT,
  })
})

app.frame("/like-frame", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        <Image src="/frame_0.png" />
      </div>
    ),
    intents: [
      <TextInput placeholder="Comment (optional)" />,
      <Button.Transaction target="/like-action">25 $DEGEN</Button.Transaction>,
      <Button.Transaction target="/like-action">50 $DEGEN</Button.Transaction>,
      <Button.Transaction target="/like-action">100 $DEGEN</Button.Transaction>,
    ],
    action: "/done",
  })
})

app.transaction("/like-action", async (c) => {
  const { inputText, buttonIndex, frameData } = c
  const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!)
  let recipientAddress = await client
    .fetchBulkUsers([Number(frameData?.castId.fid)])
    .then((res) => res.users[0].verified_addresses.eth_addresses[0] as Address)
  let amount = 0
  switch (buttonIndex) {
    case 1:
      amount = 25
      break
    case 2:
      amount = 50
      break
    case 3:
      amount = 100
      break
    default:
      amount = 0
      break
  }
  const taxAmount = await publicClient.readContract({
    address: SUPER_LIKE_BASE_SEPOLIA_CONTRACT,
    abi: superLikeAbi,
    functionName: "calcTax",
    args: [DEGEN_BASE_SEPOLIA_CONTRACT],
  })

  const schemaEncoder = new SchemaEncoder(
    "address cast_hash, string comment, uint256 to_fid, uint256 from_fid, uint256 tax_amount, uint256 tip_amount, address currency"
  )
  const encodedData = schemaEncoder.encodeData([
    {
      name: "cast_hash",
      value: frameData?.castId.hash,
      type: "address",
    },
    {
      name: "comment",
      value: inputText,
      type: "string",
    },
    {
      name: "to_fid",
      value: frameData?.castId.fid,
      type: "uint256",
    },
    {
      name: "from_fid",
      value: frameData?.fid,
      type: "uint256",
    },
    {
      name: "tax_amount",
      value: taxAmount as any,
      type: "uint256",
    },
    {
      name: "tip_amount",
      value: parseEther(amount.toString()),
      type: "uint256",
    },
    {
      name: "currency",
      value: DEGEN_BASE_SEPOLIA_CONTRACT,
      type: "address",
    },
  ])
  return c.contract({
    abi: superLikeAbi,
    chainId: `eip155:${baseSepolia.id}`,
    functionName: "execute",
    args: [
      recipientAddress,
      encodedData as `0x${string}`,
      DEGEN_BASE_SEPOLIA_CONTRACT,
      parseEther(amount.toString()),
    ],
    to: SUPER_LIKE_BASE_SEPOLIA_CONTRACT,
  })
})

app.frame("/done", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        <Image src="/frame_0.png" />
      </div>
    ),
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
