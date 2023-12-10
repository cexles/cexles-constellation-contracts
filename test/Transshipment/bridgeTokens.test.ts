import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers, getChainId } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  sign,
  Domain,
  typesForBridge,
  ZERO_ADDRESS,
  ZERO_BYTES,
  standardPrepare,
  MassageParamStructAbi,
  BridgeParamsStruct,
} from "@test-utils";
import { ITransshipmentStructures } from "@contracts/Transshipment";
import { ParamType } from "@ethersproject/abi";

describe("Method: bridgeTokens: ", () => {
  let result: ContractTransaction;
  const amount: BigNumber = ethers.utils.parseUnits("10", 18);
  const fees: BigNumber = ethers.utils.parseUnits("1", 18);

  describe("When all parameters correct ", () => {
    describe("should success bridge tokens for EOA with account bridge (fee in ETH)", () => {
      let link, srcUSDC, dstUSDC, transshipmentSender, transshipmentReceiver, manager, user, alice, srcDomain;
      let userDstAccount;

      before(async () => {
        const res = await loadFixture(standardPrepare);
        (link = res.link),
          (srcUSDC = res.srcUSDC),
          (dstUSDC = res.dstUSDC),
          (transshipmentSender = res.transshipmentSender),
          (transshipmentReceiver = res.transshipmentReceiver),
          (manager = res.manager),
          (user = res.user),
          (alice = res.alice),
          (srcDomain = res.srcDomain);

        const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
        const userDstAccountAddress = userSrcAccountAddress; // one address for all networks
        console.count();

        await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
        await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

        await srcUSDC.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
        await srcUSDC.connect(alice).approve(transshipmentSender.address, amount);

        await transshipmentSender.connect(user).createAccount("name_src_1", 1);
        const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

        userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
        await dstUSDC.connect(user).mint(userDstAccount.address, ethers.utils.parseUnits("100", 18));

        const bridgeParams: BridgeParamsStruct = {
          userAddress: alice.address,
          userNonce: await transshipmentSender.userNonce(alice.address),
          srcTokenAddress: srcUSDC.address,
          srcTokenAmount: amount,
          dstChainSelector: 2,
          dstExecutor: userDstAccount.address, // eq to srcAccount
          dstTokenAddress: dstUSDC.address,
          dstTokenAmount: amount,
          dstReceiver: user.address,
        };

        const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

        result = await transshipmentSender
          .connect(alice)
          .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, { value: fees });
      });

      it("should not be reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("should be transfer srcUSDC tokens from alice to user", async () => {
        await expect(result).to.changeTokenBalances(
          srcUSDC,
          [alice.address, userDstAccount.address],
          [amount.mul(-1), amount]
        );
      });

      it("should be get tokens dstUSDC from alice to user", async () => {
        await expect(result).to.changeTokenBalances(
          dstUSDC,
          [userDstAccount.address, user.address],
          [amount.mul(-1), amount]
        );
      });
    });

    describe("should success bridge tokens for EOA with account bridge (fee in Token)", () => {
      let link, srcUSDC, dstUSDC, transshipmentSender, transshipmentReceiver, manager, user, alice, srcDomain;
      let userDstAccount;

      before(async () => {
        const res = await loadFixture(standardPrepare);
        (link = res.link),
          (srcUSDC = res.srcUSDC),
          (dstUSDC = res.dstUSDC),
          (transshipmentSender = res.transshipmentSender),
          (transshipmentReceiver = res.transshipmentReceiver),
          (manager = res.manager),
          (user = res.user),
          (alice = res.alice),
          (srcDomain = res.srcDomain);

        const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
        const userDstAccountAddress = userSrcAccountAddress; // one address for all networks

        await srcUSDC.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
        await srcUSDC.connect(alice).approve(transshipmentSender.address, ethers.utils.parseUnits("10", 18));

        await link.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
        await link.connect(alice).approve(transshipmentSender.address, ethers.utils.parseUnits("1", 18));

        await transshipmentSender.connect(user).createAccount("name_src_1", 1);
        const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

        userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
        await dstUSDC.connect(user).mint(userDstAccount.address, ethers.utils.parseUnits("100", 18));

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

        result = await transshipmentSender
          .connect(alice)
          .bridgeTokens(managerSignature, link.address, 200000, fees, bridgeParams);
      });

      it("should not be reverted", async () => {
        await expect(result).to.be.not.reverted;
      });

      it("should be transfer srcUSDC tokens from alice to user", async () => {
        await expect(result).to.changeTokenBalances(
          srcUSDC,
          [alice.address, userDstAccount.address],
          [amount.mul(-1), amount]
        );
      });

      it("should be get tokens dstUSDC from alice to user", async () => {
        await expect(result).to.changeTokenBalances(
          dstUSDC,
          [userDstAccount.address, user.address],
          [amount.mul(-1), amount]
        );
      });
    });

    it("should success bridge ETH for EOA with account bridge (fee in ETH)", async () => {
      const { srcUSDC, dstUSDC, transshipmentSender, manager, user, alice, srcDomain } = await loadFixture(
        standardPrepare
      );

      const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
      const userDstAccountAddress = userSrcAccountAddress; // one address for all networks
      console.count();
      console.log(await user.getBalance());

      await transshipmentSender.connect(user).createAccount("name_src_1", 1);
      const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

      const userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
      await dstUSDC.connect(user).mint(userDstAccount.address, 1000);

      console.count();

      const amountToSend = ethers.utils.parseUnits("20", 18);
      await user.sendTransaction({
        to: userDstAccount.address,
        value: amountToSend,
      });

      const bridgeParams: BridgeParamsStruct = {
        userAddress: user.address,
        userNonce: await transshipmentSender.userNonce(user.address),
        srcTokenAddress: ZERO_ADDRESS,
        srcTokenAmount: ethers.utils.parseUnits("19", 18),
        dstChainSelector: 2,
        dstExecutor: userDstAccount.address, // eq to srcAccount
        dstTokenAddress: dstUSDC.address,
        dstTokenAmount: ethers.utils.parseUnits("19", 18),
        dstReceiver: alice.address,
      };

      console.count();

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      console.log("managerSignature: ", managerSignature);

      result = await transshipmentSender
        .connect(user)
        .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, {
          value: ethers.utils.parseUnits("20", 18),
        });

      console.log(await dstUSDC.balanceOf(user.address));

      await expect(result).to.be.not.reverted;
      console.log("alice.getBalance()", await alice.getBalance());
      console.log(await user.getBalance());
      console.log(await transshipmentSender.getFailedMessagesIds());
    });

    // it("should success bridge ETH for EOA with account bridge (fee in Token)", async () => {
    //   const { link, dstUSDC, transshipmentSender, manager, user, alice, srcDomain } = await loadFixture(
    //     standardPrepare
    //   );

    //   const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
    //   const userDstAccountAddress = userSrcAccountAddress; // one address for all networks

    //   await link.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
    //   await link.connect(alice).approve(transshipmentSender.address, ethers.utils.parseUnits("1", 18));

    //   await transshipmentSender.connect(user).createAccount("name_src_1", 1);
    //   const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

    //   // await transshipmentReceiver.connect(user).createAccount("name_dst_1", 1);
    //   const userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
    //   await dstUSDC.connect(user).mint(userDstAccount.address, 1000);

    //   const bridgeParams: BridgeParamsStruct = {
    //     userAddress: alice.address,
    //     userNonce: await transshipmentSender.userNonce(user.address),
    //     srcTokenAddress: ZERO_ADDRESS,
    //     srcTokenAmount: ethers.utils.parseUnits("50", 18),
    //     dstChainSelector: 2,
    //     dstExecutor: userDstAccount.address, // eq to srcAccount
    //     dstTokenAddress: dstUSDC.address,
    //     dstTokenAmount: ethers.utils.parseUnits("50", 18),
    //     dstReceiver: user.address,
    //   };

    //   console.count();

    //   const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

    //   console.log("managerSignature: ", managerSignature);

    //   const fees = ethers.utils.parseUnits("1", 18);
    //   const amount = ethers.utils.parseUnits("50", 18);

    //   console.log("before alice", await alice.getBalance());
    //   console.log("before user", await user.getBalance());

    //   result = await transshipmentSender
    //     .connect(alice)
    //     .bridgeTokens(managerSignature, link.address, 200000, fees, bridgeParams, { value: amount });

    //   console.log(await dstUSDC.balanceOf(user.address));

    //   await expect(result).to.be.not.reverted;
    //   console.log("after alice", await alice.getBalance());
    //   console.log("after user", await user.getBalance());

    //   console.log(await transshipmentSender.getFailedMessagesIds());
    // });
  });
});
