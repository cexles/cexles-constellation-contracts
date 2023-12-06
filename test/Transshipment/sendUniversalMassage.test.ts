import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZERO_ADDRESS, ZERO_BYTES, standardPrepare } from "@test-utils";
import { ITransshipmentStructures } from "@contracts/Transshipment";

describe("Method: sendUniversalMassage: ", () => {
  // describe("When one of parameters is incorrect", () => {
  //   it("When try check", () => {
  //     expect(true);
  //   });
  // });

  describe("When all parameters correct ", () => {
    let result: ContractTransaction;

    it("should success send tokens from EOA", async () => {
      const { link, srcUSDC, transshipmentSender, transshipmentReceiver, user } = await loadFixture(
        standardPrepare
      );

      const massageParam1: ITransshipmentStructures.MassageParamStruct = {
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

      const massageParam2: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 2,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: srcUSDC.address,
        amount: ethers.utils.parseUnits("50", 18),
        feeToken: link.address,
        gasLimit: 200000,
      };
      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      result = await transshipmentSender.connect(user).sendUniversalMassage([massageParam1, massageParam2]);

      await expect(result).to.be.not.reverted;
      console.log(await srcUSDC.balanceOf(transshipmentReceiver.address));
      console.log(await srcUSDC.balanceOf(user.address));

      console.log("getLastReceivedMessageDetails", await transshipmentSender.getLastReceivedMessageDetails());
    });
  });
});
