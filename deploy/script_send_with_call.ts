import { MassageParamStruct } from "./../types/typechain-types/contracts/TransshipmentWorker";
import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";
import { ContractInterface, ethers } from "ethers";
import * as TestUSDCArtifact from "../artifacts/contracts/mock/TestUSDC.sol/TestUSDC.json";

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

  const Trannsshipmetn_Mumbai = "0x78486e1A98B491d04843fcb660396e2669211C2B";
  const Trannsshipmetn_BSC = "0x973eb82B75Be09B901Dd8295f4105b3141032fDd";

  const BnM_token_Mumbai = "0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40";
  const BnM_token_BSC = "0xbfa2acd33ed6eec0ed3cc06bf1ac38d22b36b9e9";

  const srcChainParams = {};

  const dstChainParams = {
    callTargetAddress: BnM_token_BSC,
    callValue: 0,
    callData: "",
    to: deployer,
    amount: 100,
  };

  // Create a new Contract instance
  const ERC20 = new ethers.Contract(deployer, TestUSDCArtifact.abi as ContractInterface); // FAKE contract

  // Encode the function call
  const encodedData = ERC20.interface.encodeFunctionData("transfer", [
    dstChainParams.to,
    dstChainParams.amount,
  ]);

  console.log("Encoded data:", encodedData);
  dstChainParams.callData = encodedData;

  const dstMassageParam: MassageParamStruct = {
    destinationChainSelector: 0,
    receiver: ZERO_ADDRESS,
    dataToSend: ZERO_BYTES,
    addressToExecute: dstChainParams.callTargetAddress,
    valueToExecute: 0,
    dataToExecute: dstChainParams.callData,
    token: ZERO_ADDRESS,
    amount: 0,
    feeToken: ZERO_ADDRESS,
    gasLimit: 0,
  };

  const encodedDstMassageParam = ethers.utils.defaultAbiCoder.encode(MassageParamStructAbi, [
    dstMassageParam,
  ]);

  const massageParam: MassageParamStruct = {
    destinationChainSelector: "13264668187771770619",
    receiver: Trannsshipmetn_BSC, // address at bsc
    dataToSend: encodedDstMassageParam,
    addressToExecute: ZERO_ADDRESS,
    valueToExecute: 0,
    dataToExecute: ZERO_BYTES,
    token: BnM_token_Mumbai,
    amount: dstChainParams.amount,
    feeToken: link,
    gasLimit: 500000,
  };

  console.log("Execute transfer from Transshipment to deployer at ", Transshipment.address);
  await execute("Transshipment", { from: deployer, log: true }, "sendMassage", massageParam);
};

migrate.tags = ["sendAndCall"];

export default migrate;
