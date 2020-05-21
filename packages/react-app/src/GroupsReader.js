import React from 'react'
import { ethers } from "ethers";

import { useContractLoader, useContractReader, useEventListener, useBlockNumber, useBalance } from "./hooks"

const contractName = "ProtoGroup"

export default function GroupsReader(props) {

  const readContracts = useContractLoader(props.localProvider);
  console.log("readContracts",readContracts);
  const details = useContractReader(readContracts,contractName,"getGroupDetails",1777);
  console.log("details", details);
  const contractAddress = readContracts?readContracts[contractName].address:""
  console.log("contractAddress", contractAddress);

  let displayDetails, displayContractAddress;

  if(readContracts && readContracts[contractName]){
    displayDetails = (details);
    displayContractAddress = contractAddress;
  }

  return (
    <div>
      {displayDetails} <br />
      {displayContractAddress}
    </div>
    
  );
}
