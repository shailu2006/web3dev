const { network, ethers, deployments } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

// Run Unit test only on development enviroment.
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        // Deploy our fundme contract using hardhat-deploy
        // const accounts = await ethers.getSigners();
        // const accounteOne = accounts[0];
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async () => {
        it("Sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("Fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("Update the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Add funder to array of funders", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunders(0);
          assert.equal(funder, deployer);
        });
      });

      describe("widthdraw", async () => {
        beforeEach(async () => {
          // Fund the contract before withdrawing.
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // ACT
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // gasCost
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice); // Since they are BigNumber use the mul function

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance),
            endingDeployerBalance.add(gasCost).toString()
          );
        });
      });

      it("allows us to withdraw with multiple funders", async () => {
        const accounts = await ethers.getSigners();
        for (let i = 1; i < 6; i++) {
          // Arrange
          const account = accounts[i];
          const fundMeConnectedContract = await fundMe.connect(account);
          await fundMeConnectedContract.fund({ value: sendValue });
        }
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        // ACT
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait(1);
        // gasCost
        const { gasUsed, effectiveGasPrice } = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice); // Since they are BigNumber use the mul function

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const endingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        // Assert
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance),
          endingDeployerBalance.add(gasCost).toString()
        );

        // Make sure the funders are reset properly
        await expect(fundMe.getFunders(0)).to.be.reverted;
        for (let i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(accounts[i].address),
            0
          );
        }
      });

      it("only allows the owner to withdraw", async () => {
        const accounts = await ethers.getSigners();
        const attacker = accounts[1];
        const attackerConnectedContract = await fundMe.connect(attacker);
        await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
          "FundMe_NotOwner"
        );
      });

      describe("widthdraw Optimised", async () => {
        beforeEach(async () => {
          // Fund the contract before withdrawing.
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async function () {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          // ACT
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // gasCost
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice); // Since they are BigNumber use the mul function

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance),
            endingDeployerBalance.add(gasCost).toString()
          );
        });
      });

      it("allows us to withdraw with multiple funders", async () => {
        const accounts = await ethers.getSigners();
        for (let i = 1; i < 6; i++) {
          // Arrange
          const account = accounts[i];
          const fundMeConnectedContract = await fundMe.connect(account);
          await fundMeConnectedContract.fund({ value: sendValue });
        }
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        // ACT
        const transactionResponse = await fundMe.cheaperWithdraw();
        const transactionReceipt = await transactionResponse.wait(1);
        // gasCost
        const { gasUsed, effectiveGasPrice } = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice); // Since they are BigNumber use the mul function

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const endingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        // Assert
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance),
          endingDeployerBalance.add(gasCost).toString()
        );

        // Make sure the funders are reset properly
        await expect(fundMe.getFunders(0)).to.be.reverted;
        for (let i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(accounts[i].address),
            0
          );
        }
      });

      it("only allows the owner to withdraw", async () => {
        const accounts = await ethers.getSigners();
        const attacker = accounts[1];
        const attackerConnectedContract = await fundMe.connect(attacker);
        await expect(
          attackerConnectedContract.cheaperWithdraw()
        ).to.be.revertedWith("FundMe_NotOwner");
      });
    });
