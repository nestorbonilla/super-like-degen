import axios from "axios"

export const neynarClient = axios.create({
  baseURL: "https://api.neynar.com/v2/farcaster",
})

export const getUserByHandle = async (params: { handle: string }) => {
  const { data } = await neynarClient.get(`/user/search`)

  return data
}
