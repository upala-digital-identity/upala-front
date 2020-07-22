import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { upalaContractName, daiContractName, membershipStatus, INFURA_ID, IS_SHIPPED, network, BASE_GROUP_CONTRACT_NAME } from "./config";
//import { gql } from "apollo-boost";
import { ethers } from "ethers";
//import { useQuery } from "@apollo/react-hooks";
import "./App.css";
import { useExchangePrice, useGasPrice, useContractLoader, useContractReader } from "./hooks"
import { Logo, Account, Provider, Faucet, Ramp } from "./components"
import GroupsList from "./components/groups/GroupsList.js"
import GroupDetails from "./components/groups/GroupDetails.js"
import Welcome from './components/Welcome.js'
import { async } from 'bnc-notify/dist/notify.umd';


class Contract {
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
      }
      else {
        newValue = await this.contractInstance[functionName]();
      }
    }
    catch (e) {
      console.log("debug contractName, functionName", functionName);
      console.log(e);
    }
    return newValue;
  }
  async write(functionName, args, successCallback) {
    let tx = await this.read(functionName, args);
    console.log("sent");
    if (tx) {
      tx.wait().then(() => { successCallback();  console.log("mined"); });
    }
  }
  getABI(){
    return this.abi;
  }
  getAddress(){
    return this.address;
  }
  async getSignerAddress(){
    return this.contractInstance.signer.getAddress();
  }
}

// moving all Ethereum interaction into this class (substitute for contractLoader, contractReader)
class EthereumGateway {
  constructor (network) {
    this.contracts = {};
    this.signer = null;
    try{
      let contractList = require("./contracts/" + network + "/contracts.js")
      for(let c in contractList){
        let address = require("./contracts/" + network + "/" + contractList[c]+".address.js");
        let abi = require("./contracts/" + network + "/" + contractList[c]+".abi.js");
        this.contracts[contractList[c]] = new Contract(abi, address);
      }
    }catch(e){
      console.log("ERROR LOADING DEFAULT CONTRACTS!!",e)
    }
  }
  async updateProvider(provider) {
    let signer
    let accounts = await provider.listAccounts()
    if(accounts && accounts.length>0){
      signer = provider.getSigner()
    }else{
      signer = provider
    }
    this.signer = signer;
    this.initializeAllContracts();
  }
  initializeAllContracts() {
    for(let c in this.contracts){
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
  constructor(userUpalaId, contract, balanceChecker, onFieldsChange) {
    this.userUpalaId = userUpalaId;
    this.contract = contract;
    this.balanceChecker = balanceChecker;
    this.updateFields = onFieldsChange;
    this.groupAddress = contract.address;  // The owner/manager of Upala group (address)
    // defaults
    this.groupID = null; // Upala group ID (uint160)
    this.poolAddress = null; // Address of a pool attached to the group
    this.poolBalance = null;
    this.details = null; // raw details string
    this.userScore = null; // user score in the group
    this.membershipStatus = membershipStatus.NO_MEMBERSHIP; // JOINED if userScore > 0
    this.path = [];
  }

  async loadDetails(bladeRunnerID){
      this.details = JSON.parse(await this.contract.read("getGroupDetails"));
      this.groupID = (await this.contract.read("getUpalaGroupID")).toNumber();
      this.poolAddress = await this.contract.read("getGroupPoolAddress");
      this.poolBalance = await this.loadPoolBalance();
      // TODO hardcoded hierarchy for bladerunner => make it multilayer (set paths somewhere above)
      this.setPath([this.userUpalaId, this.groupID, bladeRunnerID]);
      await this.loadUserScore();
  }

  async join(userUpalaId){
    console.log("Join ", this.groupID);
    if ( await this.contract.write("join", [userUpalaId], () => this.loadUserScore()) ) {
      this.membershipStatus = membershipStatus.PENDING_JOIN;
      this.updateFields();
    }
  }

  async loadUserScore() {
      let newUserScore = await this.contract.read("getScoreByPath", [this.path]);
      if (newUserScore) {
        this.userScore = ethers.utils.formatEther(newUserScore);
        this.membershipStatus = membershipStatus.JOINED;
      } else {
        this.userScore = null;
      }
      this.updateFields();
      console.log("loadUserScore", newUserScore);
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

  getFields(){
    let newFields = {
      "groupID": this.groupID,
      "membership_status": this.membershipStatus,
      "details": this.details,
      "group_address": this.groupAddress,
      "poolAddress": this.poolAddress,
      "poolBalance": this.poolBalance,
      "user_score": this.userScore,
      "path": this.path,
      "join_handler": () => this.join(this.userUpalaId),
    }
    return newFields;
  }
}




class UpalaWallet {
  constructor(ethereumGateway, userExporter, groupsExporter) {
    this.groups = {};
    // this.userUpalaId = upalaProtocol.user_ID;
    this.ethereumGateway = ethereumGateway;
    this.exportGroups = groupsExporter;

    // this.userID = null;
    this.upalaContract = ethereumGateway.contracts[upalaContractName];
    this.exportUser = userExporter;
  }

  async registerUser() {
    let userAddress = await this.upalaContract.getSignerAddress();
    this.upalaContract.write("newIdentity", [userAddress], () => this.loadUserID());
  }

  async loadUserID() {
    let userUpalaIdRaw = await this.upalaContract.read("myId");
    if (userUpalaIdRaw) {
      let newUserID = userUpalaIdRaw.toNumber();
      if (newUserID > 0 && newUserID != this.userID) {
        this.userID = newUserID;
        this.updateUser();
        this.loadDefaultGroups();
        console.log("new userID", this.userID);
      }
    }
  }

  async loadDefaultGroups() {
    let preloadedGroupAddress = require("./contracts/" + network + "/groups.js")

    // bladeRunner TODO maybe create different adding procedure for score providers
    let randomGroupID_hack = 1232;
    const bladerunnerID = await(this.addGroupByAddress(preloadedGroupAddress[3], randomGroupID_hack));

    const group1ID = await(this.addGroupByAddress(preloadedGroupAddress[0], bladerunnerID));
    const group2ID = await(this.addGroupByAddress(preloadedGroupAddress[1], bladerunnerID));
    const group3ID = await(this.addGroupByAddress(preloadedGroupAddress[2], bladerunnerID));
  }

  async getBalance(address) {
    let bal = await this.ethereumGateway.contracts[daiContractName].read("balanceOf", [address]);
    if (bal) {
      return ethers.utils.formatEther(bal);
    }
  }
  
  async addGroupByAddress(address, bladerunnerID) { // bladeRunnerID is a temporary hack TODO
    if (typeof this.groups[address] == "undefined") {
      let abi = this.ethereumGateway.contracts[BASE_GROUP_CONTRACT_NAME].getABI();
      
      // uses address as contract name
      let newGroupContract = this.ethereumGateway.addContract(address, abi, address);
      this.groups[address] = new Group(
          this.userID,
          newGroupContract,
          (poolAddress) => this.getBalance(poolAddress),
          () => this.updateGroups());
      await this.groups[address].loadDetails(bladerunnerID);  // bladeRunnerID is a temporary hack TODO 
      return this.groups[address].groupID;
      }
  }

  calculateMaxScore() {
  }
  changeManagingAddress(newAddress) {
    this.upalaContract.write("upadateManager", newAddress);
  }
  loadGroupBalance(groupID){
  }
  loadUserScore(path){
  }
  explode(path){
    this.upalaContract.write("attack", [path], () => console.log("EXPLODED"));
  }
  
  updateGroups(){
    let newGroups = {};
    for (var address in this.groups) {
      let newEntry = this.groups[address].getFields();
      newEntry["explode_handler"] = () => this.explode(newEntry["path"]);
      newGroups[address] = newEntry;
    }
    this.exportGroups(newGroups);
  }
  updateUser(){
    let newUserID = {
      "user_ID": this.userID
    }
    this.exportUser(newUserID);
  }
}


// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",INFURA_ID);
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545");
const ethereumGateway = new EthereumGateway(network);


var globalDAIContract;
var upalaWallet;
// var upalaProtocol;

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState();
  const price = useExchangePrice(mainnetProvider);
  const gasPrice = useGasPrice("fast");

  const [userUpalaId, setUser] = useState();
  const [loadedGroups, setLoadedGroups] = useState();


  const contracts = useContractLoader(injectedProvider);
  globalDAIContract = contracts ? contracts[daiContractName] : null



  // TODO does not update on changing account in metamask
  useEffect(() => {
    async function initializeUpala(provider) {
      if(typeof provider != "undefined")
      {
        await ethereumGateway.updateProvider(provider);
        upalaWallet = new UpalaWallet(ethereumGateway, setUser, setLoadedGroups);
        upalaWallet.loadUserID();
      }
    }
    initializeUpala(injectedProvider)
  },[injectedProvider]);


  return (
    <div className="App">
      <header>
        <Logo />
        <div style={{position:'fixed',textAlign:'right',right:0,top:0,padding:10}}>
          <Account
            address={address}
            setAddress={setAddress}
            localProvider={IS_SHIPPED ? injectedProvider : localProvider}
            injectedProvider={injectedProvider}
            setInjectedProvider={setInjectedProvider}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </div>
      </header>

      <div>
        <div className="menu">
          <h2>Membership</h2>
          <h3>Suggestions:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membershipStatus.NO_MEMBERSHIP}
            setactiveGroupID={setactiveGroupID}
          />

          <h3>Pending:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membershipStatus.PENDING_JOIN}
            setactiveGroupID={setactiveGroupID}
          />

          <h3>Joined:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membershipStatus.JOINED}
            setactiveGroupID={setactiveGroupID}
          />

        </div>
        <div>
        { activeGroupID ? (
          <GroupDetails
            activeGroup = {loadedGroups[activeGroupID]}
          />
          ) : ""
        }
        </div>

        <div>
          <div>
            <Welcome
              userUpalaId={userUpalaId}
              registerHandler={() => upalaWallet.registerUser()}
            />
          </div>
        </div>
      </div>
      
      { !IS_SHIPPED ? (
      <div style={{position:'fixed',textAlign:'left',left:0,bottom:20,padding:10}}>
        <Faucet
          localProvider={localProvider}
        />

      </div>
      ) : ""
      }
    </div>
  );
}

export default App;
