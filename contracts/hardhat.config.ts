import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import dotenv from "dotenv"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    base_sepolia: {
      accounts: [process.env.TEST_PRIVATE_KEY!],
      url: process.env.BASE_SEPOLIA_URL,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    customChains: [
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
    apiKey: {
      base_sepolia: process.env.BASE_SEPOLIA_EXPLORER_KEY!,
    },
  },
}

export default config
