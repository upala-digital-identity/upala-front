import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { daiContractName, membership_status, INFURA_ID, IS_SHIPPED, network, GROUP_ABI_FILE } from "./config";
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

var globalDAIContract;

class Group {
  constructor(contract) {
    // set defaults
    this.group_address = contract.address;  // The owner/manager of Upala group (address)
    this.contract = contract;
    this.groupID = null; // Upala group ID (uint160)
    this.pool_address = null; // Address of a pool attached to the group
    this.details = null; // raw details string
    this.user_score = null; // user score in the group
    this.membership_status = membership_status.NO_MEMBERSHIP; // JOINED if user_score > 0
    this.path = [];
    console.log("Group object created", this);
  }
  async loadFromContract(functionName, args) {
    let newValue;
    try {
      if (args && args.length > 0) {
        newValue = await this.contract[functionName](...args);
      }
      else {
        newValue = await this.contract[functionName]();
      }
    }
    catch (e) {
      console.log("debug contractName, functionName", functionName);
      console.log(e);
    }
    return newValue;
  }
  setPath(newPath) {
    this.path = newPath;
  }
  async loadDetails(){
      this.details = await this.loadFromContract("getGroupDetails");
      this.groupID = (await this.loadFromContract("getUpalaGroupID")).toNumber();
      this.pool_address = await this.loadFromContract("getGroupPoolAddress");
  }
  async join(userUpalaId, callback){
    console.log("Join ", this.groupID);
    await this.contract.join(userUpalaId, { gasLimit: ethers.utils.hexlify(400000) });
    this.membership_status = membership_status.PENDING_JOIN;
    callback();
  }
  async loadUserScore(path, userAddress) {
      this.user_score = ethers.utils.formatEther(await this.loadFromContract("memberScore", [path, { from: userAddress }]));
      console.log("this.user_score", this.user_score);
  }
  async explode(callback){
    await this.contract.attack(this.path, { gasLimit: ethers.utils.hexlify(400000) });
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



var userGroups;
class UserGroups {
  constructor(userUpalaId, signer, updater) {
    this.groups = {};
    this.userUpalaId = userUpalaId;
    this.signer = signer;
    this.updater = updater;
  }
  async addGroupAddress(address) {
    if (typeof this.groups[address] == "undefined") {
      try {
        let newContract = new ethers.Contract(
          address, 
          require("./contracts/" + network + "/" + GROUP_ABI_FILE), 
          this.signer
        );
        this.groups[address] = new Group(newContract);
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

  updateUI(){
    let newLoadedGroups = {};
    for (var address in this.groups) {
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


// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",INFURA_ID)
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

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
    async function initializeUserGroups(provider, userUpalaId) {
      console.log("initializeUserGroups", provider, userUpalaId);
      if(typeof provider != "undefined" && typeof userUpalaId != "undefined")
      {
        console.log("initializeUserGroups", provider, userUpalaId);
        try{
          //we need to check to see if this provider has a signer or not
          let signer
          let accounts = await provider.listAccounts()
          if(accounts && accounts.length>0){
            signer = provider.getSigner()
          }else{
            signer = provider
          }
          userGroups = new UserGroups(userUpalaId, signer, setLoadedGroups);
          let preloadedGroupAddress = require("./contracts/" + network + "/" + "ProtoGroup.address.js");
          userGroups.addGroupAddress(preloadedGroupAddress);

        }catch(e){
          console.log("ERROR LOADING CONTRACTS!!",e)
        }
      }
    }
    initializeUserGroups(injectedProvider, userUpalaId)
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
