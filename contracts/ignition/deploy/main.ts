import { ethers } from "hardhat"

const main = async () => {
  const poolWallet = "0xd4967F03B2a23087Ef354A6d2afC27AC483BBA91"
  const eas = "0x4200000000000000000000000000000000000021"
  const easSchema =
    "0x0c85fd0843cfa881aaf811d0451b0ea54fa76e3e41f82f2edbf510ef0b82d918"

  const factory = await ethers.getContractFactory("FarcasterSuperLike")

  const contract = await factory.deploy(poolWallet, eas, easSchema)

  await contract.waitForDeployment()

  console.log(`FarcasterSuperLike: ${await contract.getAddress()}`)
}

main()
