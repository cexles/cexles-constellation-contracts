import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy } = typedDeployments(deployments);
  const { deployer } = await getNamedAccounts();

  await deploy("MOCK_ERC721", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("Ready \n");
};

migrate.tags = ["erc721"];

export default migrate;
