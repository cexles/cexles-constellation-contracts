import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { ethers, getChainId } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Transshipment, Account, MockCCIPRouter, MockERC20 } from "@contracts";
import { sign, Domain, typesForBridge, ZERO_ADDRESS, ZERO_BYTES, BridgeParamsStruct } from "@test-utils";
import { ITransshipmentStructures } from "@contracts/Transshipment";
import { ParamType } from "@ethersproject/abi";

const MassageParamStructAbi = [
  {
    components: [
      {
        name: "destinationChainSelector",
        type: "uint64",
      },
      {
        name: "receiver",
        type: "address",
      },
      {
        name: "dataToSend",
        type: "bytes",
      },
      {
        name: "addressToExecute",
        type: "address",
      },
      {
        name: "valueToExecute",
        type: "uint256",
      },
      {
        name: "dataToExecute",
        type: "bytes",
      },
      {
        name: "token",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
      {
        name: "feeToken",
        type: "address",
      },
      {
        name: "gasLimit",
        type: "uint256",
      },
    ],
    name: "massageParam",
    type: "tuple",
  },
];

describe("Method: safeMint: ", () => {
  const prepareEnvironment = async () => {
    const [deployer, operator, manager, user, alice] = await ethers.getSigners();

    const MockERC20Instance = await ethers.getContractFactory("MockERC20");
    const link = await MockERC20Instance.deploy();

    const srcUSDC = await MockERC20Instance.deploy();
    const dstUSDC = await MockERC20Instance.deploy();

    const AccountInstance = await ethers.getContractFactory("Account");
    const accountContractImpl = await AccountInstance.deploy();

    const RouterInstance = await ethers.getContractFactory("MockCCIPRouter");
    const router = await RouterInstance.deploy(link.address);

    const TransshipmentInstance = await ethers.getContractFactory("Transshipment");
    const transshipmentSender = await TransshipmentInstance.deploy(
      router.address,
      link.address,
      accountContractImpl.address,
      manager.address
    );

    const transshipmentReceiver = await TransshipmentInstance.deploy(
      router.address,
      link.address,
      accountContractImpl.address,
      manager.address
    );

    const srcDomain = {
      name: "Transshipment",
      version: "0.0.1",
      chainId: "31337" || (await getChainId()),
      verifyingContract: transshipmentSender.address,
    };

    return {
      transshipmentSender,
      transshipmentReceiver,
      router,
      link,
      srcUSDC,
      dstUSDC,
      deployer,
      operator,
      manager,
      user,
      alice,
      srcDomain,
    };
  };

  describe("When one of parameters is incorrect", () => {
    it("When try check", () => {
      expect(true);
    });
  });

  describe("When all parameters correct ", () => {
    // let user: SignerWithAddress, manager: SignerWithAddress;
    // let srcUSDC: MockERC20;
    // let dstUSDC: MockERC20;
    // let link: MockERC20;
    // let router: MockCCIPRouter;
    // let transshipmentSender: Transshipment;
    // let transshipmentReceiver: Transshipment;
    // let srcDomain: Domain;

    let result: ContractTransaction;

    it("should success send tokens from EOA", async () => {
      const { link, srcUSDC, transshipmentSender, transshipmentReceiver, user } = await loadFixture(
        prepareEnvironment
      );

      const massageParam: ITransshipmentStructures.MassageParamStruct = {
        destinationChainSelector: 2,
        receiver: transshipmentReceiver.address, // address at bsc
        dataToSend: ZERO_BYTES,
        addressToExecute: ZERO_ADDRESS,
        valueToExecute: 0,
        dataToExecute: ZERO_BYTES,
        token: srcUSDC.address,
        amount: 100,
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

    it("should success send massage from account to account for transfer tokens", async () => {
      const {
        link,
        srcUSDC,
        dstUSDC,
        router,
        transshipmentSender,
        transshipmentReceiver,
        manager,
        user,
        deployer,
        srcDomain,
      } = await loadFixture(prepareEnvironment);

      await transshipmentSender.connect(deployer).allowlistSender(transshipmentReceiver.address, true);
      await transshipmentReceiver.connect(deployer).allowlistSender(transshipmentSender.address, true);

      console.log("transshipmentSender: ", transshipmentSender.address);
      console.log("transshipmentReceiver: ", transshipmentReceiver.address);

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

      const encodedTransfer = dstUSDC.interface.encodeFunctionData("transfer", [manager.address, 100]);
      const encodedData = userDstAccount.interface.encodeFunctionData("execute", [
        dstUSDC.address,
        0,
        encodedTransfer,
      ]);

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

      console.log(await dstUSDC.balanceOf(userDstAccount.address));

      await expect(result).to.be.not.reverted;
    });

    // it("should success send massage from account to account for transfer tokens with middle chain", async () => {
    //   const {
    //     link,
    //     srcUSDC,
    //     dstUSDC,
    //     router,
    //     transshipmentSender,
    //     transshipmentReceiver,
    //     manager,
    //     user,
    //     srcDomain,
    //   } = await loadFixture(prepareEnvironment);

    //   const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
    //   const userDstAccountAddress = await transshipmentReceiver.getAccountAddress(user.address);

    //   await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
    //   await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

    //   await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
    //   await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

    //   await transshipmentSender.connect(user).createAccount("name", 1);
    //   const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

    //   await transshipmentReceiver.connect(user).createAccount("name", 1);
    //   const userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
    //   await dstUSDC.connect(user).mint(userDstAccount.address, 1000);

    //   const encodedTransfer = dstUSDC.interface.encodeFunctionData("transfer", [manager.address, 100]); // Encode transfer from dstAcc to manager
    //   const encodedData = userDstAccount.interface.encodeFunctionData("execute", [
    //     dstUSDC.address,
    //     0,
    //     encodedTransfer,
    //   ]); // Encode call user dst account call usdc for transfer

    //   const dstMassageParam: ITransshipmentStructures.MassageParamStruct = {
    //     destinationChainSelector: 0,
    //     receiver: ZERO_ADDRESS,
    //     dataToSend: ZERO_BYTES,
    //     addressToExecute: userDstAccount.address,
    //     valueToExecute: 0,
    //     dataToExecute: encodedData,
    //     token: ZERO_ADDRESS,
    //     amount: 0,
    //     feeToken: ZERO_ADDRESS,
    //     gasLimit: 0,
    //   };

    //   const encodedDstMassageParam = ethers.utils.defaultAbiCoder.encode(
    //     MassageParamStructAbi as ParamType[],
    //     [dstMassageParam]
    //   );

    //   const massageParam: ITransshipmentStructures.MassageParamStruct = {
    //     destinationChainSelector: "2",
    //     receiver: transshipmentReceiver.address,
    //     dataToSend: encodedDstMassageParam,
    //     addressToExecute: ZERO_ADDRESS,
    //     valueToExecute: 0,
    //     dataToExecute: ZERO_BYTES,
    //     token: ZERO_ADDRESS,
    //     amount: 0,
    //     feeToken: ZERO_ADDRESS,
    //     gasLimit: 200000,
    //   };

    //   const encodedDstMassageParam = ethers.utils.defaultAbiCoder.encode(
    //     MassageParamStructAbi as ParamType[],
    //     [dstMassageParam]
    //   );

    //   const fees = ethers.utils.parseUnits("1", 18);

    //   const encodedTransshipmentCallData = transshipmentReceiver.interface.encodeFunctionData("sendMassage", [
    //     massageParam,
    //   ]);

    //   result = await userSrcAccount
    //     .connect(user)
    //     .execute(transshipmentSender.address, fees, encodedTransshipmentCallData, { value: fees });

    //   console.log(await dstUSDC.balanceOf(userDstAccount.address));

    //   await expect(result).to.be.not.reverted;
    // });

    it("should success bridge tokens for EOA with account bridge", async () => {
      const {
        link,
        srcUSDC,
        dstUSDC,
        router,
        transshipmentSender,
        transshipmentReceiver,
        manager,
        user,
        alice,
        srcDomain,
      } = await loadFixture(prepareEnvironment);

      const userSrcAccountAddress = await transshipmentSender.getAccountAddress(user.address);
      const userDstAccountAddress = userSrcAccountAddress; // one address for all networks
      console.count();

      await link.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      await link.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      // await srcUSDC.connect(user).mint(user.address, ethers.utils.parseUnits("100", 18));
      // await srcUSDC.connect(user).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await srcUSDC.connect(alice).mint(alice.address, ethers.utils.parseUnits("100", 18));
      await srcUSDC.connect(alice).approve(transshipmentSender.address, ethers.utils.parseUnits("100", 18));

      await transshipmentSender.connect(user).createAccount("name_src_1", 1);
      const userSrcAccount = (await ethers.getContractFactory("Account")).attach(userSrcAccountAddress);

      // await transshipmentReceiver.connect(user).createAccount("name_dst_1", 1);
      const userDstAccount = (await ethers.getContractFactory("Account")).attach(userDstAccountAddress);
      await dstUSDC.connect(user).mint(userDstAccount.address, 1000);

      console.count();

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

      console.count();

      const managerSignature = await sign(srcDomain, typesForBridge, bridgeParams, manager);

      console.log("managerSignature: ", managerSignature);

      const fees = ethers.utils.parseUnits("1", 18);

      result = await transshipmentSender
        .connect(alice)
        .bridgeTokens(managerSignature, ZERO_ADDRESS, 200000, fees, bridgeParams, { value: fees });

      console.log(await dstUSDC.balanceOf(alice.address));

      await expect(result).to.be.not.reverted;
    });

    // it("should increase user nonce token", async () => {
    //   const userNonce = await achievementsContract.getUserNonce(user.address);
    //   expect(userNonce).to.be.equal(userNonceBeforeMint.add(1));
    // });

    // it("should increase totalSupply", async () => {
    //   const totalSupply = await achievementsContract.totalSupply(nftId);
    //   expect(totalSupply).to.be.equal(1);
    // });

    // it("should mint one NFT token for user", async () => {
    //   const userBalance = await achievementsContract.balanceOf(user.address, nftId);
    //   expect(userBalance).to.be.equal(1);
    // });

    // it("Event Minted", async () => {
    //   await expect(result)
    //     .to.emit(achievementsContract, "Minted")
    //     .withArgs(mintParams.userAddress, mintParams.userNonce, mintParams.nftIds);
    // });
  });
});