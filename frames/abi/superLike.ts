export const superLikeAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_poolWallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_eas",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "_easSchema",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "availableTokens",
    "outputs": [
      {
        "internalType": "bool",
        "name": "available",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "taxUnit",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "currency",
        "type": "address"
      }
    ],
    "name": "calcTax",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eas",
    "outputs": [
      {
        "internalType": "contract IEAS",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "easSchema",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      },
      {
        "internalType": "address",
        "name": "_currency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "poolWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "__taxUnit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "available",
        "type": "bool"
      }
    ],
    "name": "setAvailableToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "timesCounter",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "expirationTime",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "times",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;