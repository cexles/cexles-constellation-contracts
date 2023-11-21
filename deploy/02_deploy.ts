import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { DEPLOY } from "config";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts, network }) => {
  const { deploy, get } = typedDeployments(deployments);
  const { deployer, router, link } = await getNamedAccounts();

  const ERC721 = (await get("MOCK_ERC721")).address;
  // const salt = "0x2cb3e0fc88cb7e9994b65c635b6c44f86364f03f23fec15794eee408e1b164fa";
  const regisry = "0x000000006551c19487814612e58FE06813775758";
  const impl = (await get("Account")).address;

  // address _router,
  //       address _link,
  //       IERC6551Registry _registry,
  //       address _accountImplementation,
  //       ITokenAccess _tokenContract

  await deploy("Transshipment", {
    from: deployer,
    args: [router, link, regisry, impl, ERC721],
    log: true,
  });
};

migrate.tags = ["trn"];

export default migrate;
