import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { DEPLOY } from "config";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy } = typedDeployments(deployments);
  const { deployer } = await getNamedAccounts();

  await deploy("TestUSDC", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("Ready \n");
};

migrate.tags = ["usdc"];

export default migrate;
