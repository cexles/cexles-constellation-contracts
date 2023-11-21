import { MassageParamStruct } from "./../types/typechain-types/contracts/TransshipmentWorker";
import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";

const MassageParamStructAbi = [
  {
    components: [
      {
        name: "destinationChainSelector",
        type: "uint64",
      },
      {
        name: "receiver",
        type: "address",
      },
      {
        name: "dataToSend",
        type: "bytes",
      },
      {
        name: "addressToExecute",
        type: "address",
      },
      {
        name: "valueToExecute",
        type: "uint256",
      },
      {
        name: "dataToExecute",
        type: "bytes",
      },
      {
        name: "token",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
      {
        name: "feeToken",
        type: "address",
      },
      {
        name: "gasLimit",
        type: "uint256",
      },
    ],
    name: "massageParam",
    type: "tuple",
  },
];

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy, execute, read, get } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  const Transshipment = await get("Transshipment");
  // const USDC_ADDRESS = await get("TestUSDC");

  const Trannsshipmetn_Mumbai = "0x7701CA415AbAc388479F818c783cB363D072b8F1";
  const Trannsshipmetn_BSC = "0xeB95b785c6FfA1d459F54981C9f2908155aa002e";

  const BnM_token_Mumbai = "0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40";
  const BnM_token_BSC = "0xbfa2acd33ed6eec0ed3cc06bf1ac38d22b36b9e9";

  const massageParam: MassageParamStruct = {
    destinationChainSelector: "13264668187771770619",
    receiver: Trannsshipmetn_BSC, // address at bsc
    dataToSend: ZERO_BYTES,
    addressToExecute: ZERO_ADDRESS,
    valueToExecute: 0,
    dataToExecute: ZERO_BYTES,
    token: BnM_token_Mumbai,
    amount: 100,
    feeToken: link,
    gasLimit: 200000,
  };

  console.log("Execute transfer from Transshipment to deployer at ", Transshipment.address);
  await execute("Transshipment", { from: deployer, log: true }, "sendMassage", massageParam);
};

migrate.tags = ["send"];

export default migrate;
