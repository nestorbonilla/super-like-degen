import { ethers } from "hardhat"

const main = async () => {
  const poolWallet = "0x807C69F16456F92ab2bFc9De8f14AF31051f9678"
  const eas = "0x4200000000000000000000000000000000000021"
  const easSchema =
    "0x9cf9b6987b2e52e76ce29037990acea4db6f88268e795ba9382e901c02ccc2f0"

  const factory = await ethers.getContractFactory("FarcasterSuperLike")

  const contract = await factory.deploy(poolWallet, eas, easSchema)

  await contract.waitForDeployment()

  console.log(`FarcasterSuperLike: ${await contract.getAddress()}`)
}

main()
