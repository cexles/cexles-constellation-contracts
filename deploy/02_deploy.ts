import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { deploy, get } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  const impl = (await get("Account")).address;

  await deploy("Transshipment", {
    from: deployer,
    args: [router, link, impl],
    log: true,
  });
};

migrate.tags = ["trn"];

export default migrate;
