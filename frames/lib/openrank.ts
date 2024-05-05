import axios from "axios"

export type GrobalEngagementRank = {
  fid: number
  fname: string
  username: string
  rank: number
  score: number
  percentile: number
}

export const openRankClient = axios.create({
  baseURL: "https://graph.cast.k3l.io",
})

export const getGrobalEngagementRank = async (params: { fids: string[] }) => {
  const { data } = await openRankClient.post(
    "/scores/global/engagement/fids",
    params.fids
  )

  return data as { result: GrobalEngagementRank[] }
}
