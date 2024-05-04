import { ethers } from "hardhat"

const main = async () => {
  const poolWallet = "0x807C69F16456F92ab2bFc9De8f14AF31051f9678"
  const eas = "0x4200000000000000000000000000000000000021"
  const easSchema =
    "0x1a52a4fb53bc2a4cdf581a8d684986053425aef9933d4e3a294b544efefc8076"

  const factory = await ethers.getContractFactory("FarcasterSuperLike")

  const contract = await factory.deploy(poolWallet, eas, easSchema)

  await contract.waitForDeployment()

  console.log(`FarcasterSuperLike: ${await contract.getAddress()}`)
}

main()
