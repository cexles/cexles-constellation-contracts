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
    it("Method: bridgeTokens (Wrong executor)", async () => {
      const { link, srcUSDC, dstUSDC, transshipmentSender, manager, user, alice, srcDomain } =
        await loadFixture(standardPrepare);

      const fees = ethers.utils.parseUnits("1", 18);
      const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
      const userDstAccountAddress = userSrcAccountAddress; // one address for all networks

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

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
        srcTokenAmount: 110,
        dstChainSelector: 2,
        dstExecutor: user.address, // eq to srcAccount
        dstTokenAddress: dstUSDC.address,
        dstTokenAmount: 100,
        dstReceiver: alice.address,
      };

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      await expect(
        transshipmentSender
          .connect(alice)
          .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, { value: fees })
      ).to.be.revertedWith("Wrong executor");
    });

    it("Method: bridgeTokens (Wrong Signature)", async () => {
      const { link, srcUSDC, dstUSDC, transshipmentSender, manager, user, alice, srcDomain } =
        await loadFixture(standardPrepare);

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
        srcTokenAmount: 110,
        dstChainSelector: 2,
        dstExecutor: userDstAccount.address, // eq to srcAccount
        dstTokenAddress: dstUSDC.address,
        dstTokenAmount: 100,
        dstReceiver: alice.address,
      };

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      await expect(
        transshipmentSender
          .connect(user)
          .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, { value: fees })
      ).to.be.revertedWith("Manager validation ERROR");
    });

    it("Method: bridgeTokens (Wrong amount for transfer)", async () => {
      const { link, srcUSDC, dstUSDC, transshipmentSender, manager, user, alice, srcDomain } =
        await loadFixture(standardPrepare);

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
        srcTokenAmount: 90,
        dstChainSelector: 2,
        dstExecutor: userDstAccount.address, // eq to srcAccount
        dstTokenAddress: dstUSDC.address,
        dstTokenAmount: 100,
        dstReceiver: alice.address,
      };

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      await expect(
        transshipmentSender
          .connect(alice)
          .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, { value: fees })
      ).to.be.revertedWith("Wrong amount for transfer");
    });

    it("Method: bridgeTokens (NotEnoughBalance)", async () => {
      const { link, srcUSDC, dstUSDC, transshipmentSender, manager, user, alice, srcDomain } =
        await loadFixture(standardPrepare);

      const fee = ethers.utils.parseUnits("1", 18);
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
        srcTokenAmount: 110,
        dstChainSelector: 2,
        dstExecutor: userDstAccount.address, // eq to srcAccount
        dstTokenAddress: dstUSDC.address,
        dstTokenAmount: 100,
        dstReceiver: alice.address,
      };

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      await expect(
        transshipmentSender
          .connect(alice)
          .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fee, bridgeParams)
      )
        .to.be.revertedWithCustomError(transshipmentSender, "NotEnoughBalance")
        .withArgs("0", `${fee}`);
    });

    it("Method: sendMassage (Wrong fee token)", async () => {
      const { link, srcUSDC, transshipmentSender, transshipmentReceiver, user } = await loadFixture(
        standardPrepare
      );

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 1,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: srcUSDC.address,
        amount: ethers.utils.parseUnits("10", 18),
        feeToken: srcUSDC.address,
        gasLimit: 200000,
      };

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await expect(transshipmentSender.connect(user).sendMassage(massageParam)).to.be.revertedWith(
        "Wrong fee token address"
      );
    });
  });
});
