import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { standardPrepare } from "@test-utils";

describe("Withdraw: ", () => {
  let result: ContractTransaction;
  const amount = ethers.utils.parseUnits("10", 18);

  describe("Method: withdraw", () => {
    describe("When one of parameters is incorrect", () => {
      it("When Zero balance", async () => {
        const { transshipmentSender, deployer } = await loadFixture(standardPrepare);

        await expect(
          transshipmentSender.connect(deployer).withdraw(deployer.address)
        ).to.be.revertedWithCustomError(transshipmentSender, "NothingToWithdraw");
      });

      it("When non Owner", async () => {
        const { transshipmentSender, user } = await loadFixture(standardPrepare);

        await expect(transshipmentSender.connect(user).withdraw(user.address)).to.be.revertedWith(
          "Only callable by owner"
        );
      });
    });

    describe("When all parameters correct ", () => {
      it("should success withdraw ETH", async () => {
        const { transshipmentSender, user, deployer } = await loadFixture(standardPrepare);

        await user.sendTransaction({
          to: transshipmentSender.address,
          value: amount,
        });

        result = await transshipmentSender.connect(deployer).withdraw(deployer.address);

        await expect(result).to.be.not.reverted;
        await expect(result).to.changeEtherBalances(
          [deployer.address, transshipmentSender.address],
          [amount, amount.mul(-1)]
        );
      });
    });
  });

  describe("Method: withdrawToken", () => {
    describe("When one of parameters is incorrect", () => {
      it("When Zero balance", async () => {
        const { transshipmentSender, deployer, link } = await loadFixture(standardPrepare);

        await expect(
          transshipmentSender.connect(deployer).withdrawToken(deployer.address, link.address)
        ).to.be.revertedWithCustomError(transshipmentSender, "NothingToWithdraw");
      });

      it("When non Owner", async () => {
        const { transshipmentSender, user, link } = await loadFixture(standardPrepare);

        await expect(
          transshipmentSender.connect(user).withdrawToken(user.address, link.address)
        ).to.be.revertedWith("Only callable by owner");
      });
    });

    describe("When all parameters correct ", () => {
      it("should success withdraw tokens", async () => {
        const { link, transshipmentSender, user, deployer } = await loadFixture(standardPrepare);

        await link.mint(user.address, amount);
        await link.connect(user).approve(transshipmentSender.address, amount);
        await link.connect(user).transfer(transshipmentSender.address, amount);

        result = await transshipmentSender.connect(deployer).withdrawToken(deployer.address, link.address);

        await expect(result).to.be.not.reverted;
        await expect(result).to.changeTokenBalances(
          link,
          [transshipmentSender.address, deployer.address],
          [amount.mul(-1), amount]
        );
      });
    });
  });
});
