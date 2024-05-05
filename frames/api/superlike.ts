import { ApolloClient, gql, InMemoryCache } from "@apollo/client/core"
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk"
import jsonBig from "json-bigint"

export type DecodedSchema = {
  name:
    | "cast_hash"
    | "comment"
    | "to_fid"
    | "from_fid"
    | "tax_amount"
    | "currency"
  type: "address" | "string" | "uint256"
  signature: string
  value: {
    name:
      | "cast_hash"
      | "comment"
      | "to_fid"
      | "from_fid"
      | "tax_amount"
      | "currency"
    type: "address" | "string" | "uint256"
    value: string | number // Assuming value can be either string or number
  }
}

export type ParsedSchema = {
  cast_hash: string
  comment: string
  to_fid: number
  from_fid: number
  tax_amount: number
  currency: string
}

export const easgraphClient = new ApolloClient({
  uri: "https://base-sepolia.easscan.org/graphql",
  cache: new InMemoryCache(),
})

export const parseSchemaData = (data: DecodedSchema[]) => {
  let parsedData: ParsedSchema = {
    cast_hash: "",
    comment: "",
    to_fid: 0,
    from_fid: 0,
    tax_amount: 0,
    currency: "",
  }

  for (const item of data) {
    ;(parsedData[item.name] as any) = item.value.value
  }

  return parsedData
}

export const decodeSchemaData = (data: string) => {
  const schemaDecoder = new SchemaEncoder(
    "address cast_hash, string comment, uint256 to_fid, uint256 from_fid, uint256 tax_amount, address currency"
  )
  const decodedData = JSON.parse(
    jsonBig.stringify(schemaDecoder.decodeData(data))
  )

  return decodedData as DecodedSchema[]
}

export const getAttestations = async (params?: { handles: string[] }) => {
  const { data } = await easgraphClient.query({
    query: gql`
      query ExampleQuery($where: AttestationWhereInput) {
        attestations(where: $where) {
          data
        }
      }
    `,
    variables: {
      where: {
        schemaId: {
          equals:
            "0x1a52a4fb53bc2a4cdf581a8d684986053425aef9933d4e3a294b544efefc8076",
        },
      },
    },
  })

  return data.attestations
}

export const getDecodedAttestations = async () => {
  const data = await getAttestations()

  const decodedData = data.map((attestation: any) => {
    return parseSchemaData(
      decodeSchemaData(attestation.data) as DecodedSchema[]
    )
  }) as ParsedSchema[]

  return decodedData
}

export const getGiveData = async (fid: string, data?: any) => {
  if (!data) {
    data = await getAttestations()
  }

  const decodedData = data.map((attestation: any) => {
    return parseSchemaData(
      decodeSchemaData(attestation.data) as DecodedSchema[]
    )
  }) as ParsedSchema[]

  const giveData = decodedData.filter((item) => item.from_fid === Number(fid))

  return {
    count: giveData.length,
    data: giveData,
  }
}

export const getReceiveData = async (fid: string, data?: any) => {
  if (!data) {
    data = await getAttestations()
  }

  const decodedData = data.map((attestation: any) => {
    return parseSchemaData(
      decodeSchemaData(attestation.data) as DecodedSchema[]
    )
  }) as ParsedSchema[]

  const receiveData = decodedData.filter((item) => item.to_fid === Number(fid))

  return {
    count: receiveData.length,
    data: receiveData,
  }
}

export const getTaxData = async (fid: string, data?: any) => {
  if (!data) {
    data = await getAttestations()
  }

  const decodedData = data.map((attestation: any) => {
    return parseSchemaData(
      decodeSchemaData(attestation.data) as DecodedSchema[]
    )
  }) as ParsedSchema[]

  const giveData = decodedData.filter((item) => item.from_fid === Number(fid))
  const taxData = giveData.reduce((acc, item) => {
    const found = acc.find((tax) => tax.currency === item.currency)

    if (found) {
      found.tax_amount += item.tax_amount
    } else {
      acc.push({
        currency: item.currency,
        tax_amount: item.tax_amount,
      })
    }

    return acc
  }, [] as { currency: string; tax_amount: number }[])

  return taxData
}
