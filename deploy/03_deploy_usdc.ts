import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = typedDeployments(deployments);
  const { deployer } = await getNamedAccounts();

  await deploy("MockERC20", {
    from: deployer,
    deterministicDeployment: true,
    args: [],
    log: true,
  });

  console.log("Ready \n");
};

migrate.tags = ["usdc"];

export default migrate;
