import { MassageParamStruct } from "./../types/typechain-types/contracts/TransshipmentWorker";
import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";
import { ContractInterface, ethers } from "ethers";
import * as MockERC20Artifact from "../artifacts/contracts/mock/MockERC20.sol/MockERC20.json";
import * as TransshipmentArtifact from "../artifacts/contracts/Transshipment.sol/Transshipment.json";
import * as AccountArtifact from "../artifacts/contracts/Account.sol/Account.json";

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
  // const USDC_ADDRESS = await get("MockERC20");

  const Trannsshipmetn_Mumbai = "0x78486e1A98B491d04843fcb660396e2669211C2B";
  const Trannsshipmetn_BSC = "0x973eb82B75Be09B901Dd8295f4105b3141032fDd";

  const accountAddress = "0xBda541464e3822D82e830Cc376835091c6F2C09c";

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
  const ERC20 = new ethers.Contract(deployer, MockERC20Artifact.abi as ContractInterface); // FAKE contract
  const TransshipmentContract = new ethers.Contract(
    Trannsshipmetn_Mumbai,
    TransshipmentArtifact.abi as ContractInterface
  );
  const AccountContract = new ethers.Contract(accountAddress, AccountArtifact.abi as ContractInterface);

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

  // console.log("Execute transfer from Transshipment to deployer at ", Transshipment.address);
  // await execute("Transshipment", { from: deployer, log: true }, "sendMassage", massageParam);
  const encodedTransshipmentCallData = TransshipmentContract.interface.encodeFunctionData("sendMassage", [
    massageParam,
  ]);
  console.log("Execute transfer from Transshipment to deployer at ", Transshipment.address, "with Acc");
  await execute(
    "Account",
    { from: deployer, log: true },
    "execute",
    Trannsshipmetn_Mumbai,
    0,
    encodedTransshipmentCallData
  );
  // await AccountContract.connect(deployer).execute(Trannsshipmetn_Mumbai, 0, encodedTransshipmentCallData);
};

// execute(
//   address to,
//   uint256 value,
//   bytes calldata data
// )

migrate.tags = ["sendAndCallFromAcc"];

export default migrate;
