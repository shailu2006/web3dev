import { ethers, Signer } from "./ethers-5.2.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const ethAmountObj = document.getElementById("ethAmount");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");

connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connect() {
  if (typeof window.ethereum != "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    document.getElementById("connectButton").innerText = "Connected";
    const accounts = await ethereum.request({ method: "eth_accounts" });
    console.log(accounts[0]);
  } else {
    document.getElementById("connectButton").innerText =
      "Please install Metamask";
  }
}

async function getBalance() {
  if (typeof window.ethereum != "undefined") {
    // provider / connect to the blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(ethers.utils.formatEther(balance));
  }
}

// Fund function
async function fund() {
  const ethAmount = ethAmountObj.value;
  if (ethAmount == "") {
    alert("Please enter an valid ETH amount");
    return;
  }
  // Check if connected to a wallet before proceeding
  if (typeof window.ethereum != "undefined") {
    // provider / connect to the blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // signer / wallet / someone with some gas
    const signer = provider.getSigner();
    // contract that we are intracting with
    // ^ ABI & Address
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      await listenFOrTransactionMine(transactionResponse, provider);
      console.log("Done !");
      // listen for tx to be mined
      // or listen for an event
    } catch (error) {
      console.log(error);
    }
  }
}

function listenFOrTransactionMine(transactionResponse, provider) {
  console.log(`Mining $(transactionResponse.hash)...`);
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      resolve();
    });
  });
}

// Widthraw function
async function withdraw() {
  if (typeof window.ethereum != "undefined") {
    console.log("Withdrawing...");
    // provider / connect to the blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // signer / wallet / someone with some gas
    const signer = provider.getSigner();
    // contract that we are intracting with
    // ^ ABI & Address
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw();
      await listenFOrTransactionMine(transactionResponse, provider);
      console.log("Done !");
      // listen for tx to be mined
      // or listen for an event
    } catch (error) {
      console.log(error);
    }
  }
}
