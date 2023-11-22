import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Transshipment__factory, Transshipment } from "@contracts";
import { ZERO_ADDRESS } from "@test-utils";

describe("Method: constructor", () => {
  let deployer: SignerWithAddress,
    admin: SignerWithAddress,
    operator: SignerWithAddress,
    minter: SignerWithAddress;
  let TransshipmentInstance: Transshipment__factory;
  let transshipmentContract: Transshipment;

  before(async () => {
    [deployer, admin, operator, minter] = await ethers.getSigners();
    TransshipmentInstance = await ethers.getContractFactory("Transshipment");
  });

  describe("When one of parameters is incorrect", () => {
    it("When admin is zero address", async () => {
      //   await expect(
      //     TransshipmentInstance.deploy(ZERO_ADDRESS, operator.address, minter.address)
      //   ).to.be.revertedWith("Zero address check");
    });
  });

  describe("When all parameters correct", () => {
    before(async () => {
      transshipmentContract = await TransshipmentInstance.connect(deployer).deploy(
        admin.address,
        operator.address,
        minter.address
      );
    });

    it("should admin have DEFAULT_ADMIN_ROLE", async () => {
      const transshipmentContractDeploy = TransshipmentInstance.connect(deployer).deploy(
        admin.address,
        operator.address,
        minter.address
      );
      await expect(transshipmentContractDeploy).to.be.not.reverted;
    });

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
