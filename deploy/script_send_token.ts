import { MassageParamStruct } from "./../types/typechain-types/contracts/TransshipmentWorker";
import { DeployFunction } from "hardhat-deploy/types";
import { typedDeployments } from "@utils";
import { ZERO_ADDRESS, ZERO_BYTES } from "@test-utils";

const migrate: DeployFunction = async ({ deployments, getNamedAccounts }) => {
  const { execute, get } = typedDeployments(deployments);
  const { deployer, link } = await getNamedAccounts();

  const Transshipment = await get("Transshipment");
  const Transshipment_BSC = "0xe19e7379699E0150fF6F1A2f462b30ec332D2940";
  const BnM_token_Mumbai = "0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40";

  const massageParam: MassageParamStruct = {
    destinationChainSelector: "13264668187771770619",
    receiver: Transshipment_BSC, // address at bsc
    dataToSend: ZERO_BYTES,
    addressToExecute: ZERO_ADDRESS,
    valueToExecute: 0,
    dataToExecute: ZERO_BYTES,
    token: BnM_token_Mumbai,
    amount: 100,
    feeToken: link,
    gasLimit: 200000,
  };

  console.log("Execute transfer from Transshipment to deployer at ", Transshipment.address);
  await execute("Transshipment", { from: deployer, log: true }, "sendMassage", massageParam);
};

migrate.tags = ["send"];

export default migrate;
