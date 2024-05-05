import {
  Frog,
  Button,
  TextInput,
  getFarcasterUserDetails,
  validateFramesMessage,
  parseEther,
} from "@airstack/frog"
import { devtools } from "@airstack/frog/dev"
import { serveStatic } from "@airstack/frog/serve-static"
import { handle } from "@airstack/frog/vercel"
import { config } from "dotenv"
import { base } from "viem/chains"
import { Address } from "viem"
import { degenAbi } from "../abi/degen.js"
import { dataApiApp } from "./dataapi.js"

config()

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=SuperLike&icon=flame&postUrl=https%3A%2F%2Fdegenway.vercel.app%2Fapi%2Fsuperlike"

export const app = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  basePath: "/api",
  browserLocation: ADD_URL,
})

app.frame("/", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Add "SuperLike Degen!" Action
      </div>
    ),
    intents: [
      <Button.AddCastAction action="/sl-action">Add</Button.AddCastAction>,
    ],
  })
})

app.castAction(
  "/sl-action",
  (c) => {
    console.log(
      `Beginning to SuperLike ${JSON.stringify(c.actionData.castId)} from ${
        c.actionData.fid
      }`
    )

    return c.frame({ path: "/sl-execute-frame" })
  },
  { name: "SuperLike", icon: "flame" }
)

app.frame("/sl-allowance-frame", (c) => {
  let { frameData, verified } = c
  let { inputText = "" } = frameData || {}
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Let's set the allowance for your SuperLike Degen tip.
      </div>
    ),
    intents: [
      <TextInput placeholder="Tip Amount (Degen)" />,
      <Button.Transaction target="/sl-allowance-action">
        Approve
      </Button.Transaction>,
    ],
    action: "/sl-execute-frame",
  })
})

app.transaction("/sl-allowance-action", (c) => {
  console.log("starting allowance action", c)

  return c.contract({
    abi: degenAbi,
    chainId: `eip155:${base.id}`,
    functionName: "approve",
    args: [
      // Smart contract address,
      // Value to approve
    ],
    to: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
  })
})

app.frame("/sl-execute-frame", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Now, you can set a comment with EAS or not.
      </div>
    ),
    intents: [
      <TextInput placeholder="Comment (EAS Attestation)" />,
      <Button.Transaction target="/sl-execute-action">Tip</Button.Transaction>,
    ],
    action: "/sl-thanks",
  })
})

app.transaction("/sl-execute-action", (c) => {
  let address = c.address as Address
  // Send transaction response.
  console.log("starting superlike", c)
  return c.contract({
    abi: [],
    chainId: `eip155:${base.id}`,
    functionName: "execute",
    args: [
      address,
      // Recipient address
      // Value to send
      // Comment to attest
    ],
    to: "",
    value: parseEther("0.0001"),
  })
})

app.frame("/thanks", (c) => {
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Thanks for tip with "SuperLike Degen!"
      </div>
    ),
  })
})

app.route("/data", dataApiApp)

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
