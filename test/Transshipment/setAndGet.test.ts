import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZERO_ADDRESS, standardPrepare } from "@test-utils";

describe("Set and Get method: ", () => {
  let result: ContractTransaction;

  describe("Method: allowlistDestinationChain", () => {
    describe("When one of parameters is incorrect", () => {
      it("When non Owner", async () => {
        const { transshipmentSender, user } = await loadFixture(standardPrepare);

        await expect(
          transshipmentSender.connect(user).allowlistDestinationChain("111000111", true)
        ).to.be.revertedWith("Only callable by owner");
      });
    });

    describe("When all parameters correct ", () => {
      it("should success set destinationChainSelector", async () => {
        const { transshipmentSender, deployer } = await loadFixture(standardPrepare);
        const destinationChainSelector = "111000111";

        result = await transshipmentSender
          .connect(deployer)
          .allowlistDestinationChain(destinationChainSelector, true);

        await expect(result).to.be.not.reverted;

        expect(await transshipmentSender.allowlistedDestinationChains(destinationChainSelector)).to.eq(true);
      });
    });
  });

  describe("Method: allowlistSourceChain", () => {
    describe("When one of parameters is incorrect", () => {
      it("When non Owner", async () => {
        const { transshipmentSender, user, link } = await loadFixture(standardPrepare);

        await expect(
          transshipmentSender.connect(user).allowlistSourceChain("111000111", true)
        ).to.be.revertedWith("Only callable by owner");
      });
    });

    describe("When all parameters correct ", () => {
      it("should success set sourceChainSelector", async () => {
        const { transshipmentSender, deployer } = await loadFixture(standardPrepare);
        const sourceChainSelector = "111000111";

        result = await transshipmentSender.connect(deployer).allowlistSourceChain("111000111", true);

        await expect(result).to.be.not.reverted;
        expect(await transshipmentSender.allowlistedSourceChains(sourceChainSelector)).to.eq(true);
      });
    });
  });

  describe("Method: allowlistSender", () => {
    describe("When one of parameters is incorrect", () => {
      it("When non Owner", async () => {
        const { transshipmentSender, user } = await loadFixture(standardPrepare);

        await expect(
          transshipmentSender.connect(user).allowlistSender(user.address, true)
        ).to.be.revertedWith("Only callable by owner");
      });
    });

    describe("When all parameters correct ", () => {
      it("should success set allowlistedSenders", async () => {
        const { transshipmentSender, deployer, user } = await loadFixture(standardPrepare);

        result = await transshipmentSender.connect(deployer).allowlistSender(user.address, true);

        await expect(result).to.be.not.reverted;
        expect(await transshipmentSender.allowlistedSenders(user.address)).to.eq(true);
      });
    });
  });

  describe("Method: getCreatedAccountAddress", () => {
    it("should success set allowlistedSenders", async () => {
      const { transshipmentSender, user } = await loadFixture(standardPrepare);

      expect(await transshipmentSender.connect(user).getCreatedAccountAddress(user.address)).to.be.eq(
        ZERO_ADDRESS
      );
    });
  });
});
