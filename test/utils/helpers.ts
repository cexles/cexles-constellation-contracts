import { ethers, getChainId } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { UpVsDownGameV4 } from "../../types/typechain-types";
import { BigNumber } from "ethers";
import { Account, MockCCIPRouter, MockERC20, Transshipment } from "@contracts";

export async function standardPrepare() {
  const [deployer, operator, manager, user, alice]: SignerWithAddress[] = await ethers.getSigners();

  const MockERC20Instance = await ethers.getContractFactory("MockERC20");
  const link = await MockERC20Instance.deploy();

  const srcUSDC: MockERC20 = await MockERC20Instance.deploy();
  const dstUSDC: MockERC20 = await MockERC20Instance.deploy();

  const AccountInstance = await ethers.getContractFactory("Account");
  const accountContractImpl: Account = await AccountInstance.deploy();

  const RouterInstance = await ethers.getContractFactory("MockCCIPRouter");
  const router: MockCCIPRouter = await RouterInstance.deploy(link.address);

  const TransshipmentInstance = await ethers.getContractFactory("Transshipment");

  const transshipmentContract: Transshipment = await TransshipmentInstance.deploy(
    router.address,
    link.address,
    accountContractImpl.address,
    manager.address
  );

  const transshipmentSender: Transshipment = await TransshipmentInstance.deploy(
    router.address,
    link.address,
    accountContractImpl.address,
    manager.address
  );

  const transshipmentReceiver = await TransshipmentInstance.deploy(
    router.address,
    link.address,
    accountContractImpl.address,
    manager.address
  );

  const srcDomain = {
    name: "Transshipment",
    version: "0.0.1",
    chainId: "31337" || (await getChainId()),
    verifyingContract: transshipmentSender.address,
  };

  return {
    deployer,
    operator,
    manager,
    user,
    alice,
    srcUSDC,
    dstUSDC,
    link,
    accountContractImpl,
    transshipmentContract,
    transshipmentReceiver,
    transshipmentSender,
    srcDomain,
  };
}

export const MassageParamStructAbi = [
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
