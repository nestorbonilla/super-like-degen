import {
  Frog,
  Button,
  TextInput,
  getFarcasterUserDetails,
  validateFramesMessage,
  parseEther
} from "@airstack/frog";
import { http, createPublicClient } from 'viem';
import { devtools } from "@airstack/frog/dev";
import { serveStatic } from "@airstack/frog/serve-static";
import { handle } from "@airstack/frog/vercel";
import { config } from "dotenv";
import { base, baseSepolia } from "viem/chains";
import { Address, toHex } from "viem";
import { degenAbi } from "../abi/degen.js";
import { tokenAbi } from "../abi/erc20.js";
import { superLikeAbi } from "../abi/superLike.js";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { dataApiApp } from "./dataapi.js"

config()

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=SuperLike&icon=flame&postUrl=https%3A%2F%2Fcead-2607-fb91-3ac-d81e-7c79-32e-fb6f-286d.ngrok-free.app%2Fapi%2Fsuperlike"

// MAINNET
const DEGEN_BASE_MAINNET_CONTRACT = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
const SUPER_LIKE_BASE_MAINNET_CONTRACT = ""

// SEPOLIA
const DEGEN_BASE_SEPOLIA_CONTRACT = "0x6Df63D498E27B860a58a441D8AA7ea54338830F8"
const SUPER_LIKE_BASE_SEPOLIA_CONTRACT =
  "0x84Ec3C369d8d327c6B37AF11C1c4BD6007f91a96"

export const app = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  basePath: "/api",
  browserLocation: ADD_URL,
})

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

app.frame("/", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Add "SuperLike Degen!" Action
      </div>
    ),
    intents: [
      <Button.AddCastAction action="/superlike">Add</Button.AddCastAction>,
    ],
  })
})

app.castAction(
  '/superlike',
  async (c) => {
    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

    console.log("superlike action started");
    // let userData = await client.fetchBulkUsers([c.actionData.fid]);
    let userAddress = await client.fetchBulkUsers([c.actionData.fid]).then((res) => res.users[0].verified_addresses.eth_addresses[0] as Address);
    // console.log("userAddress: ", userAddress);
    const allowance = await publicClient.readContract({
      address: DEGEN_BASE_SEPOLIA_CONTRACT,
      abi: degenAbi,
      functionName: 'allowance',
      args: [userAddress, SUPER_LIKE_BASE_SEPOLIA_CONTRACT]
    });

    if (allowance >= parseEther('100')) {
      return c.frame({ path: '/sl-like-frame' })
    } else {
      return c.frame({ path: '/sl-allowance-frame' })
    }
  },
  { name: "SuperLike", icon: "flame" }
)

app.frame('/sl-allowance-frame', (c) => {
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Give me permission to send your tip.
      </div>
    ),
    intents: [
      <Button.Transaction target="/sl-allowance-action">Approve</Button.Transaction>,
    ],
    action: "/sl-execute-frame"
  })
})

app.transaction('/sl-allowance-action', (c) => {
  return c.contract({
    abi: tokenAbi,
    chainId: `eip155:${baseSepolia.id}`,
    functionName: 'approve',
    args: [
      SUPER_LIKE_BASE_SEPOLIA_CONTRACT,
      parseEther("10000")
    ],
    to: DEGEN_BASE_SEPOLIA_CONTRACT
  })

})

app.frame('/sl-like-frame', (c) => {
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Now, you can set a comment with EAS or not.
      </div>
    ),
    intents: [
      <TextInput placeholder="Comment (optional)" />,
      <Button.Transaction target="/sl-execute-action">$25</Button.Transaction>,
      <Button.Transaction target="/sl-execute-action">$50</Button.Transaction>,
      <Button.Transaction target="/sl-execute-action">$100</Button.Transaction>
    ],
    action: "/done"
  })
})

app.transaction('/sl-execute-action', async (c) => {

  const { inputText, buttonIndex, frameData } = c;
  const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);
  let recipientAddress = await client.fetchBulkUsers([Number(frameData?.castId.fid)]).then((res) => res.users[0].verified_addresses.eth_addresses[0] as Address);
  let amount = 0;
  switch (buttonIndex) {
    case 1:
      amount = 25;
      break;
    case 2:
      amount = 50;
      break;
    case 3:
      amount = 100;
      break;
    default:
      amount = 0;
      break;
  }
  const taxAmount = await publicClient.readContract({
    address: SUPER_LIKE_BASE_SEPOLIA_CONTRACT,
    abi: superLikeAbi,
    functionName: 'calcTax',
    args: [DEGEN_BASE_SEPOLIA_CONTRACT]
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
    functionName: 'execute',
    args: [
      recipientAddress,
      encodedData as `0x${string}`,
      DEGEN_BASE_SEPOLIA_CONTRACT,
      parseEther(amount.toString())
    ],
    to: SUPER_LIKE_BASE_SEPOLIA_CONTRACT
  })
})

app.frame('/done', (c) => {
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Thanks for tip with "SuperLike Degen!"
      </div>
    )
  })
})

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);