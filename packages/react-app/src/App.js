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
  async write(functionName, args) {
    return this.read(functionName, args);
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
      this.fieldsChanged();
  }

  async join(userUpalaId){
    console.log("Join ", this.groupID);
    if ( await this.contract.write("join", [userUpalaId]) ) {
      this.membership_status = membership_status.PENDING_JOIN;
      await this.loadUserScore();
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
  constructor(upalaProtocol, ethereumGateway, updater) {
    this.groups = {};
    this.userUpalaId = upalaProtocol.user_ID;
    this.ethereumGateway = ethereumGateway;
    this.updater = updater;
  }
  async addGroupByAddress(address) {
    if (typeof this.groups[address] == "undefined") {
      let abi = this.ethereumGateway.contracts[BASE_GROUP_CONTRACT_NAME].getABI();
      // uses address as contract name
      let newGroupContract = this.ethereumGateway.addContract(address, abi, address);
      this.groups[address] = new Group(
          this.userUpalaId,
          newGroupContract,
          () => this.updateUI());
        await this.groups[address].loadDetails();
      }
  }
  calculateMaxScore() {
    
  }
  updateUI(){
    let newLoadedGroups = {};
    for (var address in this.groups) {
      let newEntry = this.groups[address].getFields();
      newLoadedGroups[address] = newEntry;
    }
    this.updater(newLoadedGroups);
  }
}

class UpalaProtocol {
  constructor(upalaContract, onFieldsChange) {
    this.upalaContract = upalaContract;
    this.exportFields = onFieldsChange;
    this.userID = null;
  }
  async registerID() {
    let userAddress = await this.upalaContract.getSignerAddress();
    if(await this.upalaContract.write("newIdentity", [userAddress])){
      this.loadUserID();
    }
  }
  changeManagingAddress(newAddress) {
    this.upalaContract.write("upadateManager", newAddress);
  }
  async loadUserID(){
    let userUpalaIdRaw = await this.upalaContract.read("myId");
    if (userUpalaIdRaw) {
      this.userID = userUpalaIdRaw.toNumber();
    }
    console.log("this.userID", this.userID);
    this.updateFields();
  }
  loadGroupBalance(groupID){
  }
  loadUserScore(path){
  }
  explode(path){
    this.upalaContract.write("explode", path);
  }
  updateFields(){
    console.log("update Upala fields")
    let newFields = {
      "user_ID": this.userID,
      "register_handler": () => this.registerID()
    }
    this.exportFields(newFields);
  }
}

// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",INFURA_ID);
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545");
const ethereumGateway = new EthereumGateway(network);


var globalDAIContract;
var userGroups;
var upalaProtocol;

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState();
  const price = useExchangePrice(mainnetProvider);
  const gasPrice = useGasPrice("fast");

  const [userUpalaId, setUserUpalaId] = useState();
  const [loadedGroups, setLoadedGroups] = useState();


  const contracts = useContractLoader(injectedProvider);
  globalDAIContract = contracts ? contracts[daiContractName] : null

  async function initializeUpalaWallet() {
    if (upalaProtocol.user_ID > 0) {
      console.log("userUpalaId.user_ID", upalaProtocol.user_ID);
      let preloadedGroupAddress = require("./contracts/" + network + "/groups.js")
      userGroups.addGroupByAddress(preloadedGroupAddress[0]);
      userGroups.addGroupByAddress(preloadedGroupAddress[1]);
      userGroups.addGroupByAddress(preloadedGroupAddress[2]);
    }
  }

  // TODO will not update on changing account in metamask
  useEffect(() => {
    async function initializeUpala(provider) {
      if(typeof provider != "undefined")
      {
        await ethereumGateway.updateProvider(provider);
        upalaProtocol = new UpalaProtocol(ethereumGateway.contracts[upalaContractName], initializeUpalaWallet);
        userGroups = new UpalaWallet(upalaProtocol, ethereumGateway, setLoadedGroups);
        upalaProtocol.loadUserID();
      }
    }
    initializeUpala(injectedProvider)
  },[injectedProvider]);

  // useEffect(() => {
  //   async function initializeUpalaWallet(userUpalaId) {
  //     if(typeof userUpalaId != "undefined" && typeof userUpalaId.user_ID != "undefined")
  //     {
  //       if (userUpalaId.user_ID > 0) {
  //         console.log("userUpalaId.user_ID", userUpalaId.user_ID);
  //         userGroups = new UpalaWallet(upalaProtocol, ethereumGateway, setLoadedGroups);
  //         let preloadedGroupAddress = require("./contracts/" + network + "/groups.js")
  //         userGroups.addGroupByAddress(preloadedGroupAddress[0]);
  //         userGroups.addGroupByAddress(preloadedGroupAddress[1]);
  //         userGroups.addGroupByAddress(preloadedGroupAddress[2]);
  //       }
  //     }
  //   }
  //   initializeUpalaWallet(userUpalaId)
  // },[userUpalaId]);





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
            injectedProvider={injectedProvider}
          />
          ) : ""
        }
        </div>

        <div>
          <div>
            <Welcome
              address={address}
              injectedProvider={injectedProvider}
              localProvider={IS_SHIPPED ? injectedProvider : localProvider}
              price={price}
              gasPrice={gasPrice}
              userUpalaId={userUpalaId}
              //setUserUpalaId={setUserUpalaId}
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
