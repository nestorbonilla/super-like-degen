import { Frog, Button, TextInput, parseEther } from "@airstack/frog"
import { http, createPublicClient } from "viem"
import { devtools } from "@airstack/frog/dev"
import { serveStatic } from "@airstack/frog/serve-static"
import { handle } from "@airstack/frog/vercel"
import { config } from "dotenv"
import { base, baseSepolia } from "viem/chains"
import { Address } from "viem"
import { degenAbi } from "../abi/degen.js"
import { tokenAbi } from "../abi/erc20.js"
import { superLikeAbi } from "../abi/superLike.js"
import { NeynarAPIClient } from "@neynar/nodejs-sdk"
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk"
import { dataApiApp } from "./dataapi.js"
import {
  ADD_URL,
  AIRSTACK_API_KEY,
  BASE_URL,
  CHAIN_ID,
  DEGEN_CONTRACT,
  SUPER_LIKE_CONTRACT,
} from "../lib/config.js"

config()

export const app = new Frog({
  apiKey: AIRSTACK_API_KEY as string,
  basePath: "/api",
  browserLocation: ADD_URL,
})

export const publicClient = createPublicClient({
  chain: CHAIN_ID === "8453" ? base : baseSepolia,
  transport: http(),
})

app.frame("/", (c) => {
  return c.res({
    image: `${BASE_URL}/frame_0.jpg`,
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
      address: DEGEN_CONTRACT,
      abi: degenAbi,
      functionName: "allowance",
      args: [userAddress, SUPER_LIKE_CONTRACT],
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
    image: `${BASE_URL}/frame_1.jpg`,
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
    chainId: `eip155:${Number(CHAIN_ID)}` as any,
    functionName: "approve",
    args: [SUPER_LIKE_CONTRACT, parseEther("10000")],
    to: DEGEN_CONTRACT,
  })
})

app.frame("/like-frame", (c) => {
  return c.res({
    image: `${BASE_URL}/frame_2.jpg`,
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
  let userAddress = await client
    .fetchBulkUsers([Number(c.frameData?.fid)])
    .then((res) => res.users[0].verified_addresses.eth_addresses[0] as Address)
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
    address: SUPER_LIKE_CONTRACT,
    abi: superLikeAbi,
    functionName: "calcTax",
    args: [DEGEN_CONTRACT],
    account: userAddress as Address,
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
      value: DEGEN_CONTRACT,
      type: "address",
    },
  ])
  return c.contract({
    abi: superLikeAbi,
    chainId: `eip155:${Number(CHAIN_ID)}` as any,
    functionName: "execute",
    args: [
      recipientAddress,
      encodedData as `0x${string}`,
      DEGEN_CONTRACT,
      parseEther(amount.toString()),
    ],
    to: SUPER_LIKE_CONTRACT,
  })
})

app.frame("/done", (c) => {
  return c.res({
    image: `${BASE_URL}/frame_0.jpg`,
  })
})

app.route("/superlike-data", dataApiApp)

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
