import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { ContractInterface, ethers } from "ethers";
import * as TestUSDCArtifact from "../artifacts/contracts/mock/TestUSDC.sol/TestUSDC.json";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy, execute, read, get } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  const Transshipment = await get("Transshipment");
  const USDC_ADDRESS = await get("TestUSDC");

  const callTargetAddress = USDC_ADDRESS.address;

  // Create a new Contract instance
  const USDC = new ethers.Contract(callTargetAddress, TestUSDCArtifact.abi as ContractInterface);

  const to = deployer;
  const amount = "100";

  // Encode the function call
  const encodedData = USDC.interface.encodeFunctionData("transfer", [to, amount]);

  console.log("Encoded data:", encodedData);

  const value = 0;
  const data = encodedData;

  //   console.log("Transfer USDC to Transshipment:");
  //   await execute("TestUSDC", { from: deployer, log: true }, "transfer", callAddress, amount);

  //   const balance = await read("TestUSDC", "balanceOf", Transshipment.address);
  //   console.log("Transshipment address:", Transshipment.address);
  //   console.log("Transshipment USDC balance:", balance);

  console.log("Execute transfer from Transshipment to deployer:");
  await execute("Transshipment", { from: deployer, log: true }, "execute", callTargetAddress, value, data);
};

migrate.tags = ["execute"];

export default migrate;
