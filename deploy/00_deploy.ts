import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { DEPLOY } from "config";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, execute, read } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  const MumbaiChainSelector = "12532609583862916517";

  await deploy("TokenTransferor", {
    from: deployer,
    args: [router, link],
    log: true,
  });

  console.log("Setting allowlistDestinationChain");
  await execute(
    "TokenTransferor",
    { from: deployer, log: true },
    "allowlistDestinationChain",
    MumbaiChainSelector,
    true
  );

  console.log("Ready \n");
};

migrate.tags = ["tr"];

export default migrate;
