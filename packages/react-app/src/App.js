import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { upalaContractName, daiContractName, membership_status, INFURA_ID, IS_SHIPPED, network, BASE_GROUP_CONTRACT_NAME } from "./config";
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
  constructor(userUpalaId, contract, onFieldsChange) {
    this.userUpalaId = userUpalaId;
    this.contract = contract;
    // this.scoreLoader = scoreLoader;
    this.fieldsChanged = onFieldsChange;
    this.group_address = contract.address;  // The owner/manager of Upala group (address)
    // defaults
    this.groupID = null; // Upala group ID (uint160)
    this.pool_address = null; // Address of a pool attached to the group
    this.details = null; // raw details string
    this.user_score = null; // user score in the group
    this.membership_status = membership_status.NO_MEMBERSHIP; // JOINED if user_score > 0
    this.path = [];
  }

  async loadDetails(){
      console.log("loadDetails ");
      this.details = JSON.parse(await this.contract.read("getGroupDetails"));
      this.groupID = (await this.contract.read("getUpalaGroupID")).toNumber();
      this.pool_address = await this.contract.read("getGroupPoolAddress");
      
      // TODO hardcoded single layer hierarchy => make it multilayer (set paths somewhere above)
      this.setPath([this.userUpalaId, this.groupID]);
      console.log("setPath", this.userUpalaId, this.groupID)
      await this.loadUserScore();
  }

  async join(userUpalaId){
    console.log("Join ", this.groupID);
    if ( await this.contract.write("join", [userUpalaId], () => this.loadUserScore()) ) {
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
      console.log("loadUserScore", newUserScore);
  }

  async loadBalance() {
    if (globalDAIContract) {
      // globalDAIContract.balanceOf(this.pool_address);
      console.log("checkBalance");
      console.log("checkBalance", globalDAIContract.balanceOf(this.pool_address))
    }
  }

  setPath(newPath) {
    this.path = newPath;
  }

  getFields(){
    let newFields = {
      "groupID": this.groupID,
      "membership_status": this.membership_status,
      "details": this.details,
      "group_address": this.group_address,
      "user_score": this.user_score,
      "path": this.path,
      "join_handler": () => this.join(this.userUpalaId),
    }
    return newFields;
  }
  

  // poolBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.poolAddress_hack],5000);
  // // userBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.address],5000);

  // let displayPoolBalance = poolBalance?ethers.utils.formatEther(poolBalance):"Loading...";
  // let displayUserBalance = userBalance?ethers.utils.formatEther(userBalance):"Loading...";

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
    this.addGroupByAddress(preloadedGroupAddress[0]);
    this.addGroupByAddress(preloadedGroupAddress[1]);
    this.addGroupByAddress(preloadedGroupAddress[2]);
  }
  
  async addGroupByAddress(address) {
    if (typeof this.groups[address] == "undefined") {
      let abi = this.ethereumGateway.contracts[BASE_GROUP_CONTRACT_NAME].getABI();
      // uses address as contract name
      let newGroupContract = this.ethereumGateway.addContract(address, abi, address);
      this.groups[address] = new Group(
          this.userID,
          newGroupContract,
          () => this.updateGroups());
        await this.groups[address].loadDetails();
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
    console.log("update Upala fields")
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
            statusFilter={membership_status.NO_MEMBERSHIP}
            setactiveGroupID={setactiveGroupID}
          />

          <h3>Pending:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membership_status.PENDING_JOIN}
            setactiveGroupID={setactiveGroupID}
          />

          <h3>Joined:</h3>
          <GroupsList
            loadedGroups={loadedGroups}
            statusFilter={membership_status.JOINED}
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
