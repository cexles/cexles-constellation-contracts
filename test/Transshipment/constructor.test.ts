import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Transshipment__factory, Transshipment, Account, MockCCIPRouter } from "@contracts";
import { ZERO_ADDRESS } from "@test-utils";

describe("Method: constructor", () => {
  let deployer: SignerWithAddress,
    admin: SignerWithAddress,
    operator: SignerWithAddress,
    minter: SignerWithAddress,
    router: MockCCIPRouter,
    accountContractImpl: Account,
    TransshipmentInstance: Transshipment__factory,
    transshipmentContract: Transshipment;

  before(async () => {
    [deployer, admin, operator, minter] = await ethers.getSigners();
    TransshipmentInstance = await ethers.getContractFactory("Transshipment");
  });

  describe("When one of parameters is incorrect", () => {
    it("When admin is zero address", async () => {
      await expect(
        TransshipmentInstance.deploy(ZERO_ADDRESS, operator.address, minter.address, minter.address)
      ).to.be.reverted;
    });
  });

  describe("When all parameters correct", () => {
    before(async () => {
      const MockERC20Instance = await ethers.getContractFactory("MockERC20");
      const link = await MockERC20Instance.deploy();

      const AccountInstance = await ethers.getContractFactory("Account");
      accountContractImpl = await AccountInstance.deploy();

      const RouterInstance = await ethers.getContractFactory("MockCCIPRouter");
      router = await RouterInstance.deploy(link.address);

      TransshipmentInstance = await ethers.getContractFactory("Transshipment");
      transshipmentContract = await TransshipmentInstance.deploy(
        router.address,
        link.address,
        accountContractImpl.address,
        operator.address
      );
    });

    it("should be set accountImplementation", async () => {
      const accImp = await transshipmentContract.accountImplementation();

      expect(accImp).to.be.eq(accountContractImpl.address);
    });

    it("should be set manager", async () => {
      const manager = await transshipmentContract.manager();

      expect(manager).to.be.eq(operator.address);
    });

    it("should be set router", async () => {
      const rout = await transshipmentContract.getRouter();

      expect(rout).to.be.eq(router.address);
    });

    // it("should admin have DEFAULT_ADMIN_ROLE", async () => {
    //   const transshipmentContractDeploy = TransshipmentInstance.connect(deployer).deploy(
    //     admin.address,
    //     operator.address,
    //     minter.address
    //   );
    //   await expect(transshipmentContractDeploy).to.be.not.reverted;
    // });

    // it("should admin have DEFAULT_ADMIN_ROLE", async () => {
    //   const DEFAULT_ADMIN_ROLE = await achievementsContract.DEFAULT_ADMIN_ROLE();
    //   expect(await achievementsContract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    // });

    // it("should operator have OPERATOR_ROLE", async () => {
    //   const OPERATOR_ROLE = await achievementsContract.OPERATOR_ROLE();
    //   expect(await achievementsContract.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
    // });

    // it("should operator have OPERATOR_ROLE", async () => {
    //   const MINTER_ROLE = await achievementsContract.MINTER_ROLE();
    //   expect(await achievementsContract.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    // });

    // it("success: should support ERC1155 interface", async function () {
    //   const INTERFACE_ID_ER1155 = "0x01ffc9a7";
    //   expect(await achievementsContract.supportsInterface(INTERFACE_ID_ER1155)).to.be.true;
    // });
  });
});
