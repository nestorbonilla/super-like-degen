import { ethers } from "hardhat"

const main = async () => {
  const factory = await ethers.getContractFactory("EX_ERC20")
  const contract = await factory.deploy("EX_ERC20", "EX_ERC20")

  await contract.waitForDeployment()

  console.log(`EX_ERC20: ${await contract.getAddress()}`)
}

main()
