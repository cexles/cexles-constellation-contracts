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
  });
});
