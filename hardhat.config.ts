import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";

import "tsconfig-paths/register";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-watcher";
import "hardhat-deploy";
import "solidity-docgen";

import "./tasks/index";

import { HardhatUserConfig } from "hardhat/config";
import {
  DEPLOYER_KEY,
  INFURA_KEY,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  BSCSCAN_API_KEY,
  AVALANCHE_API_KEY,
  GAS_PRICE,
  NODE,
  GAS_REPORTER,
} from "config";

const { GAS_PRICE_NODE, LOGGING } = NODE;
const { FORK_PROVIDER_URI, FORK_ENABLED } = NODE.FORK;

function typedNamedAccounts<T>(namedAccounts: { [key in string]: T }) {
  return namedAccounts;
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "types/typechain-types",
  },
  networks: {
    hardhat: {
      gasPrice: GAS_PRICE_NODE,
      loggingEnabled: LOGGING,
      forking: {
        url: FORK_PROVIDER_URI,
        enabled: FORK_ENABLED,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
      chainId: 1,
      accounts: [DEPLOYER_KEY],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      chainId: 5,
      accounts: [DEPLOYER_KEY],
    },
    sepolia: {
      url: `https://1rpc.io/sepolia`,
      chainId: 11155111,
      accounts: [DEPLOYER_KEY],
    },
    avalancheFuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [DEPLOYER_KEY],
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
      chainId: 137,
      accounts: [DEPLOYER_KEY],
    },
    polygonMumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
      chainId: 80001,
      accounts: [DEPLOYER_KEY],
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: [DEPLOYER_KEY],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [DEPLOYER_KEY],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
      avalancheFuji: AVALANCHE_API_KEY,
    },
  },
  namedAccounts: typedNamedAccounts({
    deployer: 0,
    router: {
      sepolia: "0xD0daae2231E9CB96b94C8512223533293C3693Bf",
      polygonMumbai: "0x70499c328e1E2a3c41108bd3730F6670a44595D1",
      avalancheFuji: "0x554472a2720e5e7d5d3c817529aba05eed5f82d8",
      bscTestnet: "0x9527e2d01a3064ef6b50c1da1c0cc523803bcff2",
    },
    link: {
      sepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
      polygonMumbai: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
      avalancheFuji: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
      bscTestnet: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06",
    },
  }),
  docgen: {
    exclude: ["./mocks"],
    pages: "single",
  },
  watcher: {
    test: {
      tasks: [{ command: "test", params: { testFiles: ["{path}"] } }],
      files: ["./test/**/*"],
      verbose: true,
    },
  },
  gasReporter: {
    enabled: GAS_REPORTER.ENABLED,
    coinmarketcap: GAS_REPORTER.COINMARKETCAP,
    currency: GAS_REPORTER.CURRENCY,
    token: GAS_REPORTER.TOKEN,
    gasPrice: GAS_PRICE,
  },
};

export default config;
