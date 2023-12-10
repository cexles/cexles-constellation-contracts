import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PromiseOrValue } from "types/typechain-types/common";
import { BigNumberish } from "ethers";

interface RSV {
  r: string;
  s: string;
  v: number;
}

export interface Domain {
  name: string;
  version: string;
  chainId: string;
  verifyingContract: string;
}

interface IArrayItem {
  name: string;
  type: string;
}

export interface ITypes {
  [key: string]: IArrayItem[];
}

export type BridgeParamsStruct = {
  userAddress: PromiseOrValue<string>;
  userNonce: PromiseOrValue<BigNumberish>;
  srcTokenAddress: PromiseOrValue<string>;
  srcTokenAmount: PromiseOrValue<BigNumberish>;
  dstChainSelector: PromiseOrValue<BigNumberish>;
  dstExecutor: PromiseOrValue<string>;
  dstTokenAddress: PromiseOrValue<string>;
  dstTokenAmount: PromiseOrValue<BigNumberish>;
  dstReceiver: PromiseOrValue<string>;
};

export const typesForBridge = {
  BridgeParams: [
    {
      name: "userAddress",
      type: "address",
    },
    {
      name: "userNonce",
      type: "uint256",
    },
    {
      name: "srcTokenAddress",
      type: "address",
    },
    {
      internalType: "uint256",
      name: "srcTokenAmount",
      type: "uint256",
    },
    {
      name: "dstChainSelector",
      type: "uint64",
    },
    {
      name: "dstExecutor",
      type: "address",
    },
    {
      name: "dstTokenAddress",
      type: "address",
    },
    {
      name: "dstTokenAmount",
      type: "uint256",
    },
    {
      name: "dstReceiver",
      type: "address",
    },
  ],
};

const createTypedData = (domain: Domain, types: ITypes, message: BridgeParamsStruct) => {
  return {
    domain,
    types,
    primaryType: "BridgeParams",
    message,
  };
};

export const splitSignatureToRSV = (signature: string): RSV => {
  const r = "0x" + signature.substring(2).substring(0, 64);
  const s = "0x" + signature.substring(2).substring(64, 128);
  const v = parseInt(signature.substring(2).substring(128, 130), 16);

  return { r, s, v };
};

export const sign = async (
  domain: Domain,
  types: ITypes,
  message: BridgeParamsStruct,
  signer: SignerWithAddress
): Promise<string> => {
  const typedData = createTypedData(domain, types, message);

  console.log("before signTypedData");
  const rawSignature = await signer._signTypedData(typedData.domain, typedData.types, typedData.message);
  console.log("after signTypedData");

  return rawSignature;
};
