import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Transshipment } from "@contracts";
import { standardPrepare, ZERO_ADDRESS } from "@test-utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ContractTransaction } from "ethers";

describe("Method: createAccount", () => {
  // before(async () => {
  // });

  // describe("When one of parameters is incorrect", () => {
  //   it("When admin is zero address", async () => {
  //   });
  // });

  describe("When all parameters correct", () => {
    let user: SignerWithAddress,
      transshipmentSender: Transshipment,
      createdAcc: string,
      tx: ContractTransaction;

    before(async () => {
      const res = await loadFixture(standardPrepare);
      user = res.user;
      transshipmentSender = res.transshipmentSender;

      tx = await transshipmentSender.connect(user).createAccount("name", 1);

      createdAcc = await transshipmentSender.connect(user).getCreatedAccountAddress(user.address);
    });

    it("should be not reverted", async () => {
      await expect(tx).to.be.not.reverted;
    });

    it("should be created the address correctly", async () => {
      expect(await transshipmentSender.connect(user).getAccountAddress(user.address)).to.be.eq(createdAcc);
    });

    it("Should emit AccountCreated event", async () => {
      await expect(tx)
        .to.emit(transshipmentSender, "AccountCreated")
        .withArgs(user.address, createdAcc, "name", 1);
    });
  });
});
