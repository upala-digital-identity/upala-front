import React from 'react';
import { upalaContractName } from "../../config";
import { ethers } from "ethers";
import { useContractLoader } from "../../hooks"
import { Transactor } from "../../helpers"

// Shows group details screen
// Provides Join and Explode functionality
export default function GroupDetails(props) {

  const activeGroup = props.activeGroup;
  const injectedProvider = props.injectedProvider;

  // Blockchain interaction
  const writeContracts = useContractLoader(injectedProvider);
  
  function joinGroup() {
    activeGroup.join_handler();
  }

  function explode(path) {
    writeContracts[upalaContractName].
      attack(path, { gasLimit: ethers.utils.hexlify(400000) })
  }

  let displayLinks = "";
    displayLinks = (
      <div>
        <a onClick={() => joinGroup()}>Join</a> <br />
        <a onClick={() => explode(activeGroup.path)}>EXPLODE</a> <br />
      </div>
    )

  let displayScore = "";
  if (activeGroup.user_score) {
    displayScore = (
      <div>
        <b>user_score:</b> 
        <h3>{activeGroup.user_score} DAI</h3>
      </div>
    )
  }
  return (
    <div>
      <h2>{activeGroup.details.title}</h2>
      { displayScore }
      <b>Group ID:</b> {activeGroup.groupID} ({activeGroup.membership_status}) <br />
      <b>Address:</b> {activeGroup.group_address} <br />
      <br />
      <br />
      {activeGroup.details.description} <br />
      <br />
      <br />
      { displayLinks }
    </div>

  )
}
