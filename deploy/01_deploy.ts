import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { DEPLOY } from "config";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy, execute, read } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  const MumbaiChainSelector = "12532609583862916517";
  const SepoliaChainSelector = "16015286601757825753";
  const AvalancheChainSelector = "14767482510784806043";

  const contartAtSepolia = "";
  const contartAtMumbai = "";
  const contartAtAvalanche = "";

  let senders: string[] = [];
  let AlowedChains: string[] = [];

  switch (network.name) {
    case "sepolia":
      AlowedChains = [MumbaiChainSelector, AvalancheChainSelector];
      senders = [contartAtMumbai, contartAtAvalanche];
      break;

    case "polygonMumbai":
      AlowedChains = [SepoliaChainSelector, AvalancheChainSelector];
      senders = [contartAtSepolia, contartAtAvalanche];
      break;

    case "avalancheFuji":
      AlowedChains = [SepoliaChainSelector, MumbaiChainSelector];
      senders = [contartAtSepolia, contartAtMumbai];
      break;

    default:
      break;
  }

  console.log("NETWORK NAME: ", network.name);
  console.log("AlowedChains: ", AlowedChains);
  console.log("senders: ", senders);

  // const ChainSelector = network.name == "sepolia" ? MumbaiChainSelector : SepoliaChainSelector;

  await deploy("ProgrammableTokenTransfers", {
    from: deployer,
    args: [router, link],
    log: true,
  });

  // console.log("Setting allowlistDestinationChain");
  // await execute(
  //   "ProgrammableTokenTransfers",
  //   { from: deployer, log: true },
  //   "allowlistDestinationChain",
  //   ChainSelector,
  //   true
  // );

  // for (let i = 0; i < senders.length; i++) {
  //   console.log("Setting allowlistSourceChain");
  //   await execute(
  //     "ProgrammableTokenTransfers",
  //     { from: deployer, log: true },
  //     "allowlistSourceChain",
  //     ChainSelector,
  //     true
  //   );
  // }

  // for (let i = 0; i < senders.length; i++) {
  //   console.log("Setting allowlistSender", senders[i]);
  //   await execute(
  //     "ProgrammableTokenTransfers",
  //     { from: deployer, log: true },
  //     "allowlistSender",
  //     senders[i],
  //     true
  //   );
  // }

  console.log("Ready \n");
};

migrate.tags = ["trd"];

export default migrate;
