import { Frog } from "@airstack/frog"
import {
  DecodedSchema,
  decodeSchemaData,
  getAttestations,
  getDecodedAttestations,
  getGiveData,
  getReceiveData,
  getTaxData,
  ParsedSchema,
  parseSchemaData,
} from "./superlike.js"
import { getGrobalEngagementRank } from "../lib/openrank.js"

export const dataApiApp = new Frog({
  apiKey: process.env.AIRSTACK_API_KEY as string,
  basePath: "/",
})

dataApiApp.hono.get("/", async (c) => {
  const data = await getDecodedAttestations()

  return c.json(data)
})

dataApiApp.hono.get("/give/:fid", async (c) => {
  const { fid } = c.req.param()

  const giveData = await getGiveData(fid)

  return c.json(giveData)
})

dataApiApp.hono.get("/receive/:fid", async (c) => {
  const { fid } = c.req.param()

  const receiveData = await getReceiveData(fid)

  return c.json(receiveData)
})

dataApiApp.hono.get("/tax/:fid", async (c) => {
  const { fid } = c.req.param()

  const taxData = await getTaxData(fid)

  return c.json(taxData)
})

dataApiApp.hono.get("/global-engagement/:fid", async (_c) => {
  const { fid } = _c.req.param()
  const data = await getAttestations()
  const giveData = await getGiveData(fid, data)
  const receiveData = await getReceiveData(fid, data)
  const taxData = await getTaxData(fid, data)

  const openRankData = await getGrobalEngagementRank({ fids: [fid] })

  const [a, b, c, d, e, f, g, h, i] = [15, 0.1, 5, 1, 1, 5, 1, 1, 1]

  const multipliedData = openRankData.result.map((rank) => {
    const Adjusted_Score =
      rank.score *
      (1 +
        a * (1 / (1 + Math.exp(-b * (giveData.count - c)))) +
        d * (1 / (1 + Math.exp(-e * (receiveData.count - f)))) +
        g * (1 / (1 + Math.exp(-h * (taxData[0].tax_amount - i)))))
    return {
      ...rank,
      score: Adjusted_Score,
    }
  })

  return _c.json(multipliedData)
})
