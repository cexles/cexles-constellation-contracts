import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = typedDeployments(deployments);
  const { deployer } = await getNamedAccounts();

  await deploy("Account", {
    from: deployer,
    args: [],
    log: true,
  });
};

migrate.tags = ["acc"];

export default migrate;
