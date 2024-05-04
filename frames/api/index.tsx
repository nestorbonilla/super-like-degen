import {
  Frog,
  getFarcasterUserDetails,
  validateFramesMessage,
} from "@airstack/frog";
import { devtools } from "@airstack/frog/dev";
import { serveStatic } from "@airstack/frog/serve-static";
import { handle } from "@airstack/frog/vercel";
import { config } from "dotenv";
import { createClient } from "@vercel/kv";

config();

const ADD_URL =
  "https://warpcast.com/~/add-cast-action?actionType=post&name=GM&icon=sun&postUrl=https%3A%2F%2Fwearedegens.app%2Fapi%2Fsuperlike";

export const app = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  basePath: "/api",
  browserLocation: ADD_URL,
});

export async function superlike(fid: number) {
  const redis = createClient({
    url: process.env.KV_REST_API_URL as string,
    token: process.env.KV_REST_API_TOKEN as string,
  });
  const id = fid.toString();
  await redis.zincrby("superlike", 1, id);

  // Check allowance & balance

  // Transfer to split smart contract

  // Attestation creation with EAS
}
// Cast action handler
app.hono.post("/superlike", async (c) => {
  console.log(c);
  const body = await c.req.json();

  const { isValid, message } = await validateFramesMessage(body);
  const interactorFid = message?.data?.fid;
  const castFid = message?.data.frameActionBody.castId?.fid as number;
  if (isValid) {
    if (interactorFid === castFid) {
      return c.json({ message: "Nice try." }, 400);
    }

    await superlike(castFid);

    const { data, error } = await getFarcasterUserDetails({
      fid: castFid,
    });

    if (error) {
      return c.json({ message: "Error. Try Again." }, 500);
    }

    let message = `Superlike to ${data?.profileName}!`;
    if (message.length > 30) {
      message = "Superlike!";
    }

    return c.json({ message });
  } else {
    return c.json({ message: "Unauthorized" }, 401);
  }
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
