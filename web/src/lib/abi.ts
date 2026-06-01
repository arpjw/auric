export const AUR_ADDRESS = "0x650b1AdD632D1a3f09168FdF617F65d8D88d88db" as const;

export const AUR_ABI = [
  // ERC-20
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  // Ownable
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  // Auric-specific
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "burn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ── TokenVesting ──────────────────────────────────────────────────────────────

export const VESTING_ADDRESS = "0x5Ae9851eE44175253464C9bb81caB1b5A3b7A9e7" as const;

export const VESTING_ABI = [
  { name: "beneficiary", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "start",       type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint64"  }] },
  { name: "cliff",       type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint64"  }] },
  { name: "end",         type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint64"  }] },
  { name: "totalAmount", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "released",    type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "deposited",   type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool"    }] },
  {
    name: "vestedAmount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "timestamp", type: "uint64" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "releasable",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "release",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// ── AuricAMM ──────────────────────────────────────────────────────────────────

export const AMM_ADDRESS = "0x5F651F54fa97DdB2bb9162061D1a22a693b331be" as const;

export const AMM_ABI = [
  { name: "reserveToken", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "reserveEth",   type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "totalShares",  type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    name: "shares",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getAmountOut",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { name: "amountIn",   type: "uint256" },
      { name: "reserveIn",  type: "uint256" },
      { name: "reserveOut", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "swapETHForTokens",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "minTokenOut", type: "uint256" }],
    outputs: [{ name: "tokenOut", type: "uint256" }],
  },
  {
    name: "swapTokensForETH",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn",   type: "uint256" },
      { name: "minEthOut", type: "uint256" },
    ],
    outputs: [{ name: "ethOut", type: "uint256" }],
  },
  {
    name: "addLiquidity",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    outputs: [{ name: "sharesOut", type: "uint256" }],
  },
  {
    name: "removeLiquidity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "sharesToBurn", type: "uint256" }],
    outputs: [
      { name: "tokenOut", type: "uint256" },
      { name: "ethOut",   type: "uint256" },
    ],
  },
] as const;
