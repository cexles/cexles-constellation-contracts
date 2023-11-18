import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { DEPLOY } from "config";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy, execute, read } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  // const SepoliaChainSelector = "16015286601757825753";
  // const MumbaiChainSelector = "12532609583862916517";
  // const AvalancheChainSelector = "14767482510784806043";
  // const BscTestnetChainSelector = "13264668187771770619";

  // const contartAtSepolia = "0xADaA518009d3A47f16fa633Bb3650d98094f8110";
  // const contartAtMumbai = "0xa423ccF8312e6c4B8b3749157FeC825Db1e5FA69";
  // const contartAtAvalanche = "";
  // const contartAtBscTestnet = "0xF9eA4C5c035A6127AEB5Ac9B2abaf3fB19aEd6C1";

  // struct MassageParam {
  //     uint64 destinationChainSelector;
  //     address receiver;
  //     bytes dataToSend;
  //     bytes dataToExecute;
  //     address token;
  //     uint256 amount;
  //     address feeToken;
  //     uint256 gasLimit;
  // }
  // [MumbaiChainSelector, contartAtMumbai, "0x01", "0x0", "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05", link]
  // ["12532609583862916517","0xa423ccF8312e6c4B8b3749157FeC825Db1e5FA69",0x01,0x0,"0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05","1","0x779877A7B0D9E8603169DdbD7836e478b4624789","200000"]
  // [["12532609583862916517","0xa423ccF8312e6c4B8b3749157FeC825Db1e5FA69",0x01,0x0,"0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05","1","0x779877A7B0D9E8603169DdbD7836e478b4624789","200000"],["13264668187771770619","0xF9eA4C5c035A6127AEB5Ac9B2abaf3fB19aEd6C1",0x02,0x0,"0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05","2","0x779877A7B0D9E8603169DdbD7836e478b4624789","200000"]]

  // let senders: string[] = [];
  // let AlowedChains: string[] = [];

  // switch (network.name) {
  //   case "sepolia":
  //     AlowedChains = [MumbaiChainSelector, AvalancheChainSelector];
  //     senders = [contartAtMumbai, contartAtAvalanche];
  //     break;

  //   case "polygonMumbai":
  //     AlowedChains = [SepoliaChainSelector, AvalancheChainSelector];
  //     senders = [contartAtSepolia, contartAtAvalanche];
  //     break;

  //   case "avalancheFuji":
  //     AlowedChains = [SepoliaChainSelector, MumbaiChainSelector];
  //     senders = [contartAtSepolia, contartAtMumbai];
  //     break;

  //   default:
  //     break;
  // }

  // console.log("NETWORK NAME: ", network.name);
  // console.log("AlowedChains: ", AlowedChains);
  // console.log("senders: ", senders);

  await deploy("Transshipment", {
    from: deployer,
    args: [router, link, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_BYTES, ZERO_ADDRESS],
    log: true,
  });

  console.log("Ready \n");
};

migrate.tags = ["trn"];

export default migrate;
