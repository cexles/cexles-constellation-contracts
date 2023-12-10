import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZERO_ADDRESS, ZERO_BYTES, standardPrepare, MassageParamStructAbi } from "@test-utils";
import { ITransshipmentStructures } from "@contracts/Transshipment";
import { ParamType } from "@ethersproject/abi";

describe("Method: sendMassage: ", () => {
  let result: ContractTransaction;

  describe("When all parameters correct ", () => {
    it("should success send tokens from EOA (fee in token)", async () => {
      const { link, srcUSDC, transshipmentSender, transshipmentReceiver, user } = await loadFixture(
        standardPrepare
      );

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 2,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: srcUSDC.address,
        amount: ethers.utils.parseUnits("10", 18),
        feeToken: link.address,
        gasLimit: 200000,
      };

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      result = await transshipmentSender.connect(user).sendMassage(massageParam);

      await expect(result).to.be.not.reverted;
    });

    it("should success send tokens from EOA (fee in ETH)", async () => {
      const { srcUSDC, transshipmentSender, transshipmentReceiver, user } = await loadFixture(
        standardPrepare
      );

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 2,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: srcUSDC.address,
        amount: ethers.utils.parseUnits("10", 18),
        feeToken: ZERO_ADDRESS,
        gasLimit: 200000,
      };

      await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      result = await transshipmentSender
        .connect(user)
        .sendMassage(massageParam, { value: ethers.utils.parseUnits("1", 18) });

      await expect(result).to.be.not.reverted;
    });

    it("should success send ETH from EOA (fee in ETH)", async () => {
      const { transshipmentSender, transshipmentReceiver, user } = await loadFixture(standardPrepare);

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 2,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: ZERO_ADDRESS,
        amount: 0,
        feeToken: ZERO_ADDRESS,
        gasLimit: 200000,
      };

      result = await transshipmentSender
        .connect(user)
        .sendMassage(massageParam, { value: ethers.utils.parseUnits("5", 18) });

      await expect(result).to.be.not.reverted;
    });

    it("should success send ETH from EOA (fee in token)", async () => {
      const { link, transshipmentSender, transshipmentReceiver, user } = await loadFixture(standardPrepare);

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 2,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: ZERO_ADDRESS,
        amount: 0,
        feeToken: link.address,
        gasLimit: 200000,
      };

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      result = await transshipmentSender
        .connect(user)
        .sendMassage(massageParam, { value: ethers.utils.parseUnits("5", 18) });

      await expect(result).to.be.not.reverted;
    });

    it("should success send massage from account to account for transfer tokens", async () => {
      const { link, srcUSDC, dstUSDC, transshipmentSender, transshipmentReceiver, manager, user } =
        await loadFixture(standardPrepare);

      const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
      const userDstAccountAddress = await transshipmentReceiver.getAccountAddress(user.address);

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await transshipmentSender.connect(user).createAccount("name", 1);
      const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

      await transshipmentReceiver.connect(user).createAccount("name", 1);
      const userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
      await dstUSDC.connect(user).mint(userDstAccount.address, 1000);

      const encodedTransfer = dstUSDC.interface.encodeFunctionData("transfer", [manager.address, 100]); // Encode transfer from dstAcc to manager
      const encodedData = userDstAccount.interface.encodeFunctionData("execute", [
        dstUSDC.address,
        0,
        encodedTransfer,
      ]); // Encode call user dst account call usdc for transfer

      const dstMassageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 0,
        receiver: ZERO_ADDRESS,
        dataToSend: ZERO_BYTES,
        addressToExecute: userDstAccount.address,
        valueToExecute: 0,
        dataToExecute: encodedData,
        token: ZERO_ADDRESS,
        amount: 0,
        feeToken: ZERO_ADDRESS,
        gasLimit: 0,
      };

      const encodedDstMassageParam = ethers.utils.defaultAbiCoder.encode(
        MassageParamStructAbi as ParamType[],
        [dstMassageParam]
      );

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: "2",
        receiver: transshipmentReceiver.address,
        dataToSend: encodedDstMassageParam,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: ZERO_ADDRESS,
        amount: 0,
        feeToken: ZERO_ADDRESS,
        gasLimit: 200000,
      };

      const fees = ethers.utils.parseUnits("1", 18);

      const encodedTransshipmentCallData = transshipmentReceiver.interface.encodeFunctionData("sendMassage", [
        massageParam,
      ]);

      result = await userSrcAccount
        .connect(user)
        .execute(transshipmentSender.address, fees, encodedTransshipmentCallData, { value: fees });

      await expect(result).to.be.not.reverted;
    });
  });
});
