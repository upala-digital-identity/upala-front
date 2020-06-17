import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { daiContractName, membership_status, INFURA_ID, IS_SHIPPED, network, BASE_GROUP_CONTRACT_NAME } from "./config";
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
  constructor(contract) {
    // set defaults // TODO move to this.fields or similar
    this.group_address = contract.address;  // The owner/manager of Upala group (address)
    this.contract = contract;
    this.groupID = null; // Upala group ID (uint160)
    this.pool_address = null; // Address of a pool attached to the group
    this.details = null; // raw details string
    this.user_score = null; // user score in the group
    this.membership_status = membership_status.NO_MEMBERSHIP; // JOINED if user_score > 0
    this.path = [];
  }
  setPath(newPath) {
    this.path = newPath;
  }
  async loadDetails(){
      this.details = await this.contract.read("getGroupDetails");
      this.groupID = (await this.contract.read("getUpalaGroupID")).toNumber();
      this.pool_address = await this.contract.read("getGroupPoolAddress");
      // this.user_score = await this.loadUserScore();
      // console.log("this.user_score", this.user_score);
  }
  async join(userUpalaId, callback){
    console.log("Join ", this.groupID);
    let result = await this.contract.write("join", [userUpalaId, { gasLimit: ethers.utils.hexlify(400000) }]);
    if (result) {
      this.membership_status = membership_status.PENDING_JOIN;
      callback();
    }
  }
  async loadUserScore() { //}, userAddress) {
      // this.user_score = ethers.utils.formatEther(await this.contract.read("memberScore", [path, { from: userAddress }]));
      // this.user_score = ethers.utils.formatEther(await this.contract.read("memberScore", [this.path]));
      this.user_score = await this.contract.read("getScoreByPath", [this.path]);
  }
  async explode(callback){
    await this.contract.write("attack", [this.path, { gasLimit: ethers.utils.hexlify(400000) }]);
    callback();
  }
  async checkBalance() {
    if (globalDAIContract) {
      // globalDAIContract.balanceOf(this.pool_address);
      console.log("checkBalance");
      console.log("checkBalance", globalDAIContract.balanceOf(this.pool_address))
    }
  }

  // poolBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.poolAddress_hack],5000);
  // // userBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.address],5000);

  // let displayPoolBalance = poolBalance?ethers.utils.formatEther(poolBalance):"Loading...";
  // let displayUserBalance = userBalance?ethers.utils.formatEther(userBalance):"Loading...";

}




class UpalaWallet {
  constructor(userUpalaId, ethereumGateway, updater) {
    this.groups = {};
    this.userUpalaId = userUpalaId;
    this.ethereumGateway = ethereumGateway;
    this.updater = updater;
  }
  async addGroupAddress(address) {
    if (typeof this.groups[address] == "undefined") {
      try {
        console.log("addGroupAddress");
        let abi = this.ethereumGateway.contracts[BASE_GROUP_CONTRACT_NAME].getABI();
        // uses address as contract name
        let newGroupContract = this.ethereumGateway.addContract(address, abi, address);
        this.groups[address] = new Group(newGroupContract);
        await this.groups[address].loadDetails()

        // TODO hardcoded single layer hierarchy => make it multilayer (set paths somewhere above)
        this.groups[address].setPath([this.userUpalaId, this.groups[address].groupID])

        this.updateUI();
      }
      catch (e) {
        console.log("ERROR LOADING CONTRACTS!!", e);
      }
    }
  }
  calculateMaxScore() {
    
  }
  updateUI(){
    let newLoadedGroups = {};
    for (var address in this.groups) {
      // TODO warn: dublicates code in Contract class (create fields or smth. similar)
      let newEntry = {
        "groupID": this.groups[address].groupID,
        "title": "Base group",
        "membership_status": this.groups[address].membership_status,
        "details": this.groups[address].details,
        "group_address": address,
        "user_score": null,
        "short_description": "Base group short description",
        "join_handler": () => this.groups[address].join(this.userUpalaId, () => this.updateUI()),
        "path": this.groups[address].path,
      }
      newLoadedGroups[address] = newEntry;
    }
    this.updater(newLoadedGroups);
  }
}

class UpalaID {
  constructor(upalaContract, userAddress) {
    this.upalaContract = upalaContract;
    this.userAddress = userAddress;
  }
  changeManagingAddress(newAddress, callback) {
    this.upalaContract.write("upadateManager", newAddress);
  }
  getUserUpalaID(){
    this.upalaContract.read("myID", this.userAddress);
  }
  explode(path, callback){

  }
}

// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",INFURA_ID);
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545");
const ethereumGateway = new EthereumGateway(network);

var globalDAIContract;
var userGroups;

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [activeGroupID, setactiveGroupID] = useState();
  const price = useExchangePrice(mainnetProvider);
  const gasPrice = useGasPrice("fast")
  const [userUpalaId, setUserUpalaId] = useState();
  const [loadedGroups, setLoadedGroups] = useState()


  const contracts = useContractLoader(injectedProvider);
  globalDAIContract = contracts ? contracts[daiContractName] : null

  useEffect(() => {
    async function initializeUpalaWallet(provider, userUpalaId) {
      if(typeof provider != "undefined" && typeof userUpalaId != "undefined")
      {
        await ethereumGateway.updateProvider(provider);
        
        userGroups = new UpalaWallet(userUpalaId, ethereumGateway, setLoadedGroups);
        let preloadedGroupAddress = require("./contracts/" + network + "/" + "ProtoGroup.address.js");
        userGroups.addGroupAddress(preloadedGroupAddress);
      }
    }
    initializeUpalaWallet(injectedProvider, userUpalaId)
  },[injectedProvider, userUpalaId])






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
              setUserUpalaId={setUserUpalaId}
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
