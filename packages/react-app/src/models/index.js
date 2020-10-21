import {
  upalaContractName,
  membershipStatus,
  network,
  BASE_GROUP_CONTRACT_NAME,
  daiContractName,
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
  constructor(userUpalaId, contract, scoreChecker, balanceChecker, onFieldsChange) {
    // TODO add Group ID to the constructor. Must be known before creating this instance. 
    this.userUpalaId = userUpalaId; // TODO remove. Let smart contract load user id from Upala by msg.sender.
    this.contract = contract;
    this.scoreChecker = scoreChecker;
    this.balanceChecker = balanceChecker;
    this.updateFields = onFieldsChange;
    this.groupAddress = contract.address; // The owner/manager of Upala group (address)
    // defaults
    this.groupID = null; // Upala group ID (uint160)
    this.poolAddress = null; // Address of a pool attached to the group
    this.poolBalance = null;
    this.details = null; // raw details string
    this.userScore = null; // user score in the group
    this.membershipStatus = membershipStatus.NO_MEMBERSHIP; // JOINED if userScore > 0
    this.path = [];
  }

  // TODO should be checked from Upala itself. 
  // Move this func to addGroupByAddress func or similar up the hierarchy
  async loadGroupID() {
    this.groupID = (await this.contract.read("getUpalaGroupID")).toNumber();
    return this.groupID;
  }

  async loadDetails() {
    // console.log("loadDetails ");
    if (!this.groupID) {await this.loadGroupID()}
    this.details = JSON.parse(await this.contract.read("getGroupDetails"));
    this.poolAddress = await this.contract.read("getGroupPoolAddress");
    this.poolBalance = await this.loadPoolBalance();
    await this.loadUserScore();
  }

  async join(userUpalaId) {
    // console.log("Join ", this.groupID);
    if (
      await this.contract.write("join", [userUpalaId], () =>
        this.loadUserScore()
      )
    ) {
      this.membershipStatus = membershipStatus.PENDING_JOIN;
      this.updateFields();
    }
  }

  // depricated
  async _loadUserScore() {
    let newUserScore = await this.contract.read("getScoreByPath", [this.path]);
    if (newUserScore) {
      this.userScore = ethers.utils.formatEther(newUserScore);
      this.membershipStatus = membershipStatus.JOINED;
    } else {
      this.userScore = null;
    }
    this.updateFields();
    // console.log("loadUserScore", newUserScore);
  }

  async loadUserScore() {
    let newUserScore = await this.scoreChecker(this.path);
    if (newUserScore) {
      this.userScore = ethers.utils.formatEther(newUserScore);
      this.membershipStatus = membershipStatus.JOINED;
    } else {
      this.userScore = null;
    }
    this.updateFields();
    // console.log("loadUserScore", newUserScore);
  }

  

  async loadPoolBalance() {
    if (this.poolAddress) {
      console.log("checkBalance", this.balanceChecker(this.poolAddress));
      return this.balanceChecker(this.poolAddress);
    }
  }

  setPath(newPath) {
    this.path = newPath;
  }

  getFields() {
    let newFields = {
      groupID: this.groupID,
      membership_status: this.membershipStatus,
      details: this.details,
      group_address: this.groupAddress,
      poolAddress: this.poolAddress,
      poolBalance: this.poolBalance,
      user_score: this.userScore,
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
    this.BLADERUNNER_ID = 4;
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
        this.loadDefaultGroups(this.userID);
        this.loadPaths();
        // console.log("new userID", this.userID);
      } else {
        setLoader(false);
      }
    } else {
      setLoader(false);
    }
  }

  async loadDefaultGroups(userID) {
    this.addGroupByID(1, [userID, 1, 4]);
    this.addGroupByID(2, [userID, 2, 4]);
    this.addGroupByID(3, [userID, 3, 4]);
    this.addGroupByID(4);
  }

  // paths omit user ID
  async loadPaths() {
    return [
      [1,4],
      [2,4],
      [3,4],
    ]
  }

  storePaths(paths) {}

  async getBalance(address) {
    let bal = await this.ethereumGateway.contracts[
      daiContractName
    ].read("balanceOf", [address]);
    console.log("balanceOf", bal);
    if (bal) {
      return ethers.utils.formatEther(bal);
    }
  }

  async getUserScore(path) {
    let score = await this.upalaContract.read("myScore", [path]);
    return score;
  }


  // ID - Group's Upala ID
  async addGroupByID(ID, membershipPath = []) {
    // hardcoded group
    // Bladerunner is always 4 for now. Other groups are constant as well
    // for every contracts deployment, let's use it for now
    let groupAddress;
    let preloadedGroupAddress = require("../contracts/" +
      network +
      "/groups.js");
    if (ID == 1) { 
      groupAddress = preloadedGroupAddress[0];
    }
    if (ID == 2) { 
      groupAddress = preloadedGroupAddress[1];
    }
    if (ID == 3) { 
      groupAddress = preloadedGroupAddress[2];
    }
    if (ID == 4) { 
      groupAddress = preloadedGroupAddress[3];
    }

    // how really the function works:
    // try to retrieve group address from Upala
    // let groupAddress = this.upalaContract.read("getAddress", ID);

    this.addGroupByAddress(groupAddress, membershipPath);
  }

  async addGroupByAddress(address, membershipPath = []) {
    // bladeRunnerID is a temporary hack TODO
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
      // TODO newGroupContract.isUpala == true ?
      this.groups[address] = new Group(
        this.userID,
        newGroupContract,
        (path) => this.getUserScore(path),
        (poolAddress) => this.getBalance(poolAddress),
        () => this.updateGroups()
      );
      // TODO hardcoded hierarchy for bladerunner => make it multilayer (set paths somewhere above)
      if (membershipPath.length > 0) {
        this.groups[address].setPath(membershipPath);
      } else {
        let newGroupID = await this.groups[address].loadGroupID();
        this.groups[address].setPath([this.userID, newGroupID, this.BLADERUNNER_ID]);
      }
      
      await this.groups[address].loadDetails();
      return this.groups[address].groupID;
    }
  }

  async addGroup(userID, groupID, groupContract) {}

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
