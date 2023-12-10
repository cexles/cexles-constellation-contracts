import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  sign,
  typesForBridge,
  ZERO_ADDRESS,
  ZERO_BYTES,
  standardPrepare,
  BridgeParamsStruct,
} from "@test-utils";
import { ITransshipmentStructures } from "@contracts/Transshipment";

describe("Negative:", () => {
  let result: ContractTransaction;

  describe("When one of parameters is incorrect", () => {
    it("Method: initialize (owner ZERO_ADDRESS)", async () => {
      const { alice, accountContractImpl } = await loadFixture(standardPrepare);

      await expect(
        accountContractImpl.connect(alice).initialize(ZERO_ADDRESS, alice.address, "name_src_1", 1)
      ).to.be.revertedWith("INITIALIZE_FAILED");
    });

    it("Method: initialize (transshipment ZERO_ADDRESS)", async () => {
      const { alice, accountContractImpl } = await loadFixture(standardPrepare);

      await expect(
        accountContractImpl.connect(alice).initialize(alice.address, ZERO_ADDRESS, "name_src_1", 1)
      ).to.be.revertedWith("INITIALIZE_FAILED");
    });

    it("Method: bridgeTokens (Wrong Signature)", async () => {
      const {
        link,
        srcUSDC,
        dstUSDC,
        transshipmentSender,
        manager,
        user,
        alice,
        srcDomain,
        accountContractImpl,
      } = await loadFixture(standardPrepare);

      const fees = ethers.utils.parseUnits("1", 18);
      const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
      const userDstAccountAddress = userSrcAccountAddress; // one address for all networks

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await link.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
      await link.connect(alice).approve(transshipmentSender.address, ethers.utils.parseUnits("1", 18));

      await srcUSDC.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(alice).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await transshipmentSender.connect(user).createAccount("name_src_1", 1);
      const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

      const userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
      await dstUSDC.connect(user).mint(userDstAccount.address, 1000);

      const bridgeParams: BridgeParamsStruct = {
        userAddress: alice.address,
        userNonce: await transshipmentSender.userNonce(alice.address),
        srcTokenAddress: srcUSDC.address,
        srcTokenAmount: ethers.utils.parseUnits("10", 18),
        dstChainSelector: 2,
        dstExecutor: userDstAccount.address, // eq to srcAccount
        dstTokenAddress: dstUSDC.address,
        dstTokenAmount: ethers.utils.parseUnits("10", 18),
        dstReceiver: user.address,
      };

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      await expect(
        transshipmentSender
          .connect(user)
          .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, { value: fees })
      ).to.be.revertedWith("Manager validation ERROR");
    });

    it("Method: bridge (ONLY_TRANSSHIPMENT)", async () => {
      const { link, srcUSDC, dstUSDC, user, alice, accountContractImpl } = await loadFixture(standardPrepare);

      await accountContractImpl.connect(alice).initialize(alice.address, user.address, "name_src_1", 1);

      await expect(
        accountContractImpl
          .connect(alice)
          .bridge(
            srcUSDC.address,
            dstUSDC.address,
            ethers.utils.parseUnits("10", 18),
            alice.address,
            2,
            link.address,
            200000
          )
      ).to.be.revertedWith("ONLY_TRANSSHIPMENT");
    });

    it("Method: bridge with token (Unfair bridge amount)", async () => {
      const { link, srcUSDC, dstUSDC, user, alice, accountContractImpl } = await loadFixture(standardPrepare);

      await accountContractImpl.connect(alice).initialize(alice.address, user.address, "name_src_1", 1);

      await expect(
        accountContractImpl
          .connect(user)
          .bridge(
            srcUSDC.address,
            dstUSDC.address,
            ethers.utils.parseUnits("10", 18),
            alice.address,
            2,
            link.address,
            200000
          )
      ).to.be.revertedWith("Unfair bridge amount");
    });

    it("Method: bridge with ETH (Unfair bridge amount)", async () => {
      const { link, srcUSDC, dstUSDC, user, alice, accountContractImpl } = await loadFixture(standardPrepare);

      await accountContractImpl.connect(alice).initialize(alice.address, user.address, "name_src_1", 1);

      await expect(
        accountContractImpl
          .connect(user)
          .bridge(
            srcUSDC.address,
            ZERO_ADDRESS,
            ethers.utils.parseUnits("10", 18),
            alice.address,
            2,
            ZERO_ADDRESS,
            200000,
            { value: 0 }
          )
      ).to.be.revertedWith("Unfair bridge amount");
    });

    it("Method: bridge with ETH (Unfair bridge amount)", async () => {
      const { link, srcUSDC, dstUSDC, user, alice, accountContractImpl } = await loadFixture(standardPrepare);

      await accountContractImpl.connect(alice).initialize(alice.address, user.address, "name_src_1", 1);

      await expect(
        accountContractImpl
          .connect(user)
          .bridge(
            ZERO_ADDRESS,
            ZERO_ADDRESS,
            ethers.utils.parseUnits("10", 18),
            alice.address,
            2,
            ZERO_ADDRESS,
            200000,
            { value: ethers.utils.parseUnits("1", 18) }
          )
      ).to.be.revertedWith("Unfair bridge amount");
    });

    it("Method: execute (Wrong caller)", async () => {
      const { link, srcUSDC, dstUSDC, user, alice, manager, accountContractImpl } = await loadFixture(
        standardPrepare
      );

      await accountContractImpl.connect(alice).initialize(alice.address, user.address, "name_src_1", 1);

      await expect(
        accountContractImpl.connect(manager).execute(dstUSDC.address, ethers.utils.parseUnits("10", 18), "0x")
      ).to.be.revertedWith("Wrong caller");
    });
  });
});
