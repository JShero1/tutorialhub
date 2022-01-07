import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import TutorialHubAbi from "../contract/TutorialHub.abi.json";
require("arrive");

const ERC20_DECIMALS = 18;
const cUSDContractAddress = "0xb053651858F145b3127504C1045a1FEf8976BFfB";
const TutorialHubContractAddressAbi = "0xfEA2B4B906b4260706084638620d455c53FB6F59";

let kit;
let contract;
let tutorials = [];

const connectCeloWallet = async function () {
  console.log("connecting celo");
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to connect to your wallet.");
      await window.celo.enable();
      notificationOff();
      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(TutorialHubAbi, TutorialHubContractAddressAbi);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(TutorialHubContractAddressAbi, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.getElementById("balance").innerHTML = cUSDBalance;
  return cUSDBalance;
};

document.querySelector("#newTutorialBtn").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newTitle").value,
    document.getElementById("newVideo").value,
    document.getElementById("newThumbnail").value,
    document.getElementById("newDescription").value,
    document.getElementById("newPrice").value,
  ];

  notification(`⌛ Adding "${params[0]}"...`);
  try {
    const result = await contract.methods
      .uploadTutorial(...params)
      .send({ from: kit.defaultAccount });
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
  notification(`🎉 You successfully added "${params[0]}".`);
  getTutorials();
});

async function buyTutorial(index) {

  const params = [index];

  notification(`⌛ Awaiting payment for "${tutorials[index].title}"...`);

  try {
    const result = await contract.methods
      .buyTutorial(...params)
      .send({ from: kit.defaultAccount });

    notification(`🎉 You successfully supported "${tutorials[index].title}".`);

    getTutorials();
    getBalance();
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
}

const getTutorials = async function () {
  const _tutorialsCount = await contract.methods.getTutorialCount().call();
  const _tutorials = [];

  for (let i = 0; i < _tutorialsCount; i++) {
    let _tutorial = new Promise(async (resolve, reject) => {
      let tutorial = await contract.methods.getTutorial(i).call();

      resolve({
        index: i,
        instructor: tutorial[0],
        title: tutorial[1],
        video: tutorial[2],
        thumbnail: tutorial[3],
        description: tutorial[4],
        price: new BigNumber(tutorial[5]),
        students: tutorial[6],
      });
    });

    _tutorials.push(_tutorial);
  }

  tutorials = await Promise.all(_tutorials);

  renderTutorials();
};

function renderTutorials() {
  document.getElementById("tutorialList").innerHTML = "";

  tutorials.forEach((_tutorial) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = `
          ${tutorialTemplate(_tutorial)}
          <div class="tutorialTemplates">
          </div>`;

    document.getElementById("tutorialList").appendChild(newDiv);
  });
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

function tutorialTemplate(_tutorial) {
  return `
    <div class="card mb-4 mx-2 tutorialTemplate" >
    <video class="card-img-top" src="${_tutorial.video}" alt="..." poster="${_tutorial.thumbnail}" controls></video>
    <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
    ${_tutorial.students} students ⚓️
    </div>
      <div class="card-body text-left  position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_tutorial.instructor)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_tutorial.title}</h2>
        <p class="card-text mb-4" >
        by ${_tutorial.instructor}
        </p>

        <p class="card-text mb-4" >
       ${_tutorial.description}
        </p>

        <button class="btn btn-lg btn-outline-dark bg-success fs-6 p-3" id=${
          _tutorial.index
        }
          
          data-bs-toggle="modal"
          data-bs-target="#supportModal${_tutorial.index}"
        >
          <b>Buy</b> this with ${_tutorial.price} cUSD
        </button>

        <!--Modal-->
        ${supportModal(_tutorial.index)}
        <!--/Modal-->

      </div>
    </div>
  `;
}

let hasArrived = false;

window.addEventListener("load", async () => {

  document.arrive(".tutorialTemplates", () => {
    
    if (!hasArrived) {
      hasArrived = true;

      const supportBtns = document.querySelectorAll("aroja");

      supportBtns.forEach((supportBtn) => {

        supportBtn.addEventListener("click", async () => {
          
          const index = supportBtn.getAttribute("index-value");

          await buyTutorial(parseInt(index));
        });
      });
    }
  });
});

function supportModal(_index) {
  return `
    <div
      class="modal fade supportModal"
      id="supportModal${_index}"
      tabindex="-1"
      aria-labelledby="supportModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title" id="supportModalLabel">Support</h5>
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
            ></button>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-light border"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-dark supportBtn"
              data-bs-dismiss="modal"
              index-value="${_index}"
            >
              Are you sure?, If yes, Lets go! 🚀
            </button>
          </div>
        </div>
      </div>  
    </div>     
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getTutorials();
  notificationOff();
});
