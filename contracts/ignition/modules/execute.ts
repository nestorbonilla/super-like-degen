import { ZeroAddress } from "ethers"
import { ethers } from "hardhat"
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk"

const main = async () => {
  const slContractAddress = "0x84Ec3C369d8d327c6B37AF11C1c4BD6007f91a96"
  const toAddress = "0xdCb93093424447bF4FE9Df869750950922F1E30B"
  const contract = await ethers.getContractAt(
    "FarcasterSuperLike",
    slContractAddress
  )

  const taxAmount = await contract.calcTax(ZeroAddress)

  console.log(taxAmount)

  // make data to bytes for smartcontract
  const schemaEncoder = new SchemaEncoder(
    "address cast_hash, string comment, uint256 to_fid, uint256 from_fid, uint256 tax_amount, uint256 tip_amount, address currency"
  )
  const encodedData = schemaEncoder.encodeData([
    {
      name: "cast_hash",
      value: "0x2fd4cf3d94463ab5221098a39a1e9aa7aae5a49a",
      type: "address",
    },
    {
      name: "comment",
      value: "test",
      type: "string",
    },
    {
      name: "to_fid",
      value: 123,
      type: "uint256",
    },
    {
      name: "from_fid",
      value: 456,
      type: "uint256",
    },
    {
      name: "tax_amount",
      value: taxAmount as any,
      type: "uint256",
    },
    {
      name: "tip_amount",
      value: 5000,
      type: "uint256",
    },
    {
      name: "currency",
      value: ZeroAddress,
      type: "address",
    },
  ])

  let tx = await contract.execute(toAddress, encodedData, ZeroAddress, 5000, {
    value: 5000 + Number(taxAmount),
  })

  await tx.wait()
}

main()
