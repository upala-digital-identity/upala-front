import {
  upalaContractName,
  membership_status,
  network,
  BASE_GROUP_CONTRACT_NAME,
} from "../config";
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
export class Contract {
  constructor(abi, address = "0x0") {
    this.abi = abi;
    this.address = address;
    this.contractInstance = null;
  }
  initialize(signer) {
    this.contractInstance = new ethers.Contract(this.address, this.abi, signer);
  }
  async read(functionName, args) {
    let newValue;
    try {
      if (args && args.length > 0) {
        newValue = await this.contractInstance[functionName](...args);
      } else {
        newValue = await this.contractInstance[functionName]();
      }
    } catch (e) {
      // console.log("debug contractName, functionName", functionName);
      console.error(e);
    }
    return newValue;
  }
  async write(functionName, args, successCallback, rejectCallback) {
    try {
      let tx = await this.read(functionName, args);
      // console.log("sent");
      if (tx) {
        tx.wait()
          .then(() => {
            successCallback();
            console.log("mined");
          })
          .catch((e) => {
            rejectCallback(e);
          });
      }
    } catch (e) {
      rejectCallback(e);
    }
  }

  getABI() {
    return this.abi;
  }

  getAddress() {
    return this.address;
  }

  async getSignerAddress() {
    return this.contractInstance.signer.getAddress();
  }
}

// moving all Ethereum interaction into this class (substitute for contractLoader, contractReader)
export class EthereumGateway {
  constructor(network) {
    this.contracts = {};
    this.signer = null;
    try {
      let contractList = require("../contracts/" + network + "/contracts.js");
      for (let c in contractList) {
        let address = require("../contracts/" +
          network +
          "/" +
          contractList[c] +
          ".address.js");
        let abi = require("../contracts/" +
          network +
          "/" +
          contractList[c] +
          ".abi.js");
        this.contracts[contractList[c]] = new Contract(abi, address);
      }
    } catch (e) {
      console.log("ERROR LOADING DEFAULT CONTRACTS!!", e);
    }
  }
  async updateProvider(provider) {
    let signer;
    let accounts = await provider.listAccounts();
    if (accounts && accounts.length > 0) {
      signer = provider.getSigner();
    } else {
      signer = provider;
    }
    this.signer = signer;
    this.initializeAllContracts();
  }
  initializeAllContracts() {
    for (let c in this.contracts) {
      this.contracts[c].initialize(this.signer);
    }
  }
  addContract(contractName, abi, address) {
    this.contracts[contractName] = new Contract(abi, address);
    this.contracts[contractName].initialize(this.signer);
    return this.contracts[contractName];
  }
}

class Group {
  constructor(userUpalaId, contract, onFieldsChange) {
    this.userUpalaId = userUpalaId;
    this.contract = contract;
    // this.scoreLoader = scoreLoader;
    this.fieldsChanged = onFieldsChange;
    this.group_address = contract.address; // The owner/manager of Upala group (address)
    // defaults
    this.groupID = null; // Upala group ID (uint160)
    this.pool_address = null; // Address of a pool attached to the group
    this.details = null; // raw details string
    this.user_score = null; // user score in the group
    this.membership_status = membership_status.NO_MEMBERSHIP; // JOINED if user_score > 0
    this.path = [];
  }

  async loadDetails() {
    // console.log("loadDetails ");
    this.details = JSON.parse(await this.contract.read("getGroupDetails"));
    this.groupID = (await this.contract.read("getUpalaGroupID")).toNumber();
    this.pool_address = await this.contract.read("getGroupPoolAddress");

    // TODO hardcoded single layer hierarchy => make it multilayer (set paths somewhere above)
    this.setPath([this.userUpalaId, this.groupID]);
    // console.log("setPath", this.userUpalaId, this.groupID);
    await this.loadUserScore();
  }

  async join(userUpalaId) {
    // console.log("Join ", this.groupID);
    if (
      await this.contract.write("join", [userUpalaId], () =>
        this.loadUserScore()
      )
    ) {
      this.membership_status = membership_status.PENDING_JOIN;
      this.fieldsChanged();
    }
  }

  async loadUserScore() {
    let newUserScore = await this.contract.read("getScoreByPath", [this.path]);
    if (newUserScore) {
      this.user_score = ethers.utils.formatEther(newUserScore);
      this.membership_status = membership_status.JOINED;
    } else {
      this.user_score = null;
    }
    this.fieldsChanged();
    // console.log("loadUserScore", newUserScore);
  }

  async loadBalance(globalDAIContract) {
    if (globalDAIContract) {
      // globalDAIContract.balanceOf(this.pool_address);
      // console.log("checkBalance");
      console.log(
        "checkBalance",
        globalDAIContract.balanceOf(this.pool_address)
      );
    }
  }

  setPath(newPath) {
    this.path = newPath;
  }

  getFields() {
    let newFields = {
      groupID: this.groupID,
      membership_status: this.membership_status,
      details: this.details,
      group_address: this.group_address,
      user_score: this.user_score,
      path: this.path,
      join_handler: () => this.join(this.userUpalaId),
    };
    return newFields;
  }

  // poolBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.poolAddress_hack],5000);
  // // userBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.address],5000);

  // let displayPoolBalance = poolBalance?ethers.utils.formatEther(poolBalance):"Loading...";
  // let displayUserBalance = userBalance?ethers.utils.formatEther(userBalance):"Loading...";
}

export class UpalaWallet {
  constructor(ethereumGateway, userExporter, groupsExporter) {
    this.groups = {};
    // this.userUpalaId = upalaProtocol.user_ID;
    this.ethereumGateway = ethereumGateway;
    this.exportGroups = groupsExporter;

    // this.userID = null;
    this.upalaContract = ethereumGateway.contracts[upalaContractName];
    this.exportUser = userExporter;
  }

  async registerUser(setLoader) {
    try {
      console.log("Registering user");
      let userAddress = await this.upalaContract.getSignerAddress();
      this.upalaContract.write(
        "newIdentity",
        [userAddress],
        () => this.loadUserID(setLoader),
        (err) => {
          console.log(err);
          setLoader(false);
        }
      );
    } catch (e) {
      console.error(e);
      setLoader(false);
    }
  }

  async loadUserID(setLoader) {
    let userUpalaIdRaw = await this.upalaContract.read("myId");
    console.log("Enter user", userUpalaIdRaw);
    if (userUpalaIdRaw) {
      let newUserID = userUpalaIdRaw.toNumber();
      if (newUserID > 0 && newUserID !== this.userID) {
        this.userID = newUserID;
        this.updateUser(setLoader);
        this.loadDefaultGroups();
        // console.log("new userID", this.userID);
      } else {
        setLoader(false);
      }
    } else {
      setLoader(false);
    }
  }

  async loadDefaultGroups() {
    let preloadedGroupAddress = require("../contracts/" +
      network +
      "/groups.js");
    console.log(preloadedGroupAddress);
    this.addGroupByAddress(preloadedGroupAddress[0]);
    this.addGroupByAddress(preloadedGroupAddress[1]);
    this.addGroupByAddress(preloadedGroupAddress[2]);
  }

  async addGroupByAddress(address) {
    if (typeof this.groups[address] === "undefined") {
      let abi = this.ethereumGateway.contracts[
        BASE_GROUP_CONTRACT_NAME
      ].getABI();
      // uses address as contract name
      let newGroupContract = this.ethereumGateway.addContract(
        address,
        abi,
        address
      );
      this.groups[address] = new Group(this.userID, newGroupContract, () =>
        this.updateGroups()
      );
      await this.groups[address].loadDetails();
    }
  }

  calculateMaxScore() {}
  changeManagingAddress(newAddress) {
    this.upalaContract.write("upadateManager", newAddress);
  }
  loadGroupBalance(groupID) {}
  loadUserScore(path) {}
  explode(path, successCallback) {
    this.upalaContract.write("attack", [path], () => successCallback());
  }

  updateGroups() {
    let newGroups = {};
    for (var address in this.groups) {
      let newEntry = this.groups[address].getFields();
      newEntry["explode_handler"] = (successCallback) =>
        this.explode(newEntry["path"], successCallback);
      newGroups[address] = newEntry;
    }
    console.log(newGroups);
    this.exportGroups(newGroups);
  }
  updateUser(setLoader) {
    // console.log("update Upala fields");
    let newUserID = {
      user_ID: this.userID,
    };
    this.exportUser(newUserID);
    setLoader(false);
  }
}
