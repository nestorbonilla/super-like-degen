import {
  Frog,
  Button,
  TextInput,
  getFarcasterUserDetails,
  validateFramesMessage,
  parseEther,
} from "@airstack/frog";
import { http, createPublicClient } from 'viem';
import { devtools } from "@airstack/frog/dev";
import { serveStatic } from "@airstack/frog/serve-static";
import { handle } from "@airstack/frog/vercel";
import { config } from "dotenv";
import { base, baseSepolia } from "viem/chains";
import { Address, numberToHex } from "viem";
import { degenAbi } from "../abi/degen.js";
import { tokenAbi } from "../abi/erc20.js";
import { superLikeAbi } from "../abi/superLike.js";
import { NeynarAPIClient, FeedType, FilterType } from "@neynar/nodejs-sdk";

config();

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=SuperLike&icon=flame&postUrl=https%3A%2F%2Fdegenway.vercel.app%2Fapi%2Fsuperlike";

// MAINNET
const DEGEN_BASE_MAINNET_CONTRACT = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
const SUPER_LIKE_BASE_MAINNET_CONTRACT = "";

// SEPOLIA
const DEGEN_BASE_SEPOLIA_CONTRACT = "0x6Df63D498E27B860a58a441D8AA7ea54338830F8";
const SUPER_LIKE_BASE_SEPOLIA_CONTRACT = "0x49B12Aa31CC41E0D66484D5B0E2FFD6805ACb2cD";

export const app = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  basePath: "/api",
  browserLocation: ADD_URL,
});

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
})

app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Add "SuperLike Degen!" Action
      </div>
    ),
    intents: [
      <Button.AddCastAction action="/superlike">
        Add
      </Button.AddCastAction>,
    ]
  })
})

app.castAction(
  '/superlike',
  (c) => {
    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

    console.log("superlike action started");
    let likerAddress = client.fetchBulkUsers([c.actionData.fid]).then((res) => res.users[0].verified_addresses.eth_addresses[0] as Address);
    console.log("likerAddress: ", likerAddress);
    console.log("superlike action ended");

    // console.log(
    //   `Beginning to SuperLike ${JSON.stringify(c.actionData.castId)} from ${c.actionData.fid
    //   } and data: ${JSON.stringify(c)}`,
    // )

    return c.frame({ path: '/sl-allowance-frame' })
  },
  { name: "SuperLike", icon: "flame" }
)

app.frame('/sl-allowance-frame', (c) => {
  let { frameData, verified } = c;
  c.req.bodyCache
  console.log("sl-allowance-frame data: ", c);
  let likerAddress = frameData?.address as Address;
  console.log("sl-allowance-frame address: ", likerAddress);
  // // const maxAllowance = 2 ** 256 - 1;
  // console.log("before read contract");

  // const data = publicClient.readContract({
  //   address: DEGEN_BASE_SEPOLIA_CONTRACT,
  //   abi: degenAbi,
  //   functionName: 'allowance',
  //   args: [likerAddress, SUPER_LIKE_BASE_SEPOLIA_CONTRACT]
  // })
  // console.log("allowance data: ", data);
  // let { inputText = "" } = frameData || {};
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Let's set the allowance for your SuperLike Degen tip.
      </div>
    ),
    intents: [
      <TextInput placeholder="Tip Amount (Degen)" />,
      <Button.Transaction target="/sl-allowance-action">Approve</Button.Transaction>,
    ],
    action: "/sl-execute-frame"
  })
})

app.transaction('/sl-allowance-action', (c) => {
  console.log("starting allowance action", c);
  const { inputText, address } = c

  return c.contract({
    abi: tokenAbi,
    chainId: `eip155:${baseSepolia.id}`,
    functionName: 'approve',
    args: [
      SUPER_LIKE_BASE_SEPOLIA_CONTRACT,
      parseEther(inputText ?? "0")
    ],
    to: DEGEN_BASE_SEPOLIA_CONTRACT
  })

})

app.frame('/sl-execute-frame', (c) => {
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Now, you can set a comment with EAS or not.
      </div>
    ),
    intents: [
      <TextInput placeholder="Comment (EAS Attestation)" />,
      <Button.Transaction target="/sl-execute-action">Tip</Button.Transaction>,
    ],
    action: "/sl-thanks"
  })
})

// app.transaction('/sl-execute-action', (c) => {
//   let address = c.address as Address;
//   let recipientAddress = "";
//   let textToAttest = "";
//   // Send transaction response.
//   console.log("starting superlike", c);
//   return c.contract({
//     abi: superLikeAbi,
//     chainId: `eip155:${base.id}`,
//     functionName: 'execute',
//     args: [
//       recipientAddress,
//       textToAttest,
//       DEGEN_BASE_SEPOLIA_CONTRACT,
//       parseEther('0.0001')
//     ],
//     to: SUPER_LIKE_BASE_SEPOLIA_CONTRACT,
//     value: parseEther('0.0001'),
//   })
// })

app.frame('/thanks', (c) => {
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
