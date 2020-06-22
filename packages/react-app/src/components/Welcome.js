import React from 'react'
import { ethers } from "ethers";
import { useContractLoader, useContractReader } from "../hooks"
import { Transactor } from "../helpers"


const upalaContractName = "Upala"

export default function Welcome(props) {

  // const tx = Transactor(props.injectedProvider,props.gasPrice)
  // const readContracts = useContractLoader(props.localProvider);
  // const writeContracts = useContractLoader(props.injectedProvider);

  const userUpalaId = props.userUpalaId;
  // const setUserUpalaId = props.setUserUpalaId

  // const userUpalaIdRaw = useContractReader(readContracts,upalaContractName,"myId",[{ from: props.address }],1777);
  
  function register() {
    userUpalaId.register_handler();
  }

  // // setting Id for the first time
  // if (!userUpalaId && userUpalaIdRaw) {
  //   setUserUpalaId(userUpalaIdRaw.toNumber());
  //   console.log("Setting userUpalaId", userUpalaIdRaw.toNumber());
  // }

  // // reseting ID TODO remove in production.
  // if (userUpalaId && userUpalaIdRaw) {
  //   if (userUpalaId != userUpalaIdRaw.toNumber()) {
  //     setUserUpalaId(userUpalaIdRaw.toNumber());
  //     console.log("Setting userUpalaId", userUpalaIdRaw.toNumber());
  //   }
  // }

  let displayUserID = "Not registered";
  if (typeof userUpalaId != "undefined" && typeof userUpalaId.user_ID != "undefined") {
    displayUserID = userUpalaId.user_ID;
    console.log("displayUserID", displayUserID)
  }



  return (
    <div>
      <br />
      <br />
      <br />
      <br />
      <h1>🔵</h1> 
      Your Upala Id is: <h1>{displayUserID}</h1>
      <a onClick={ () => register() }>Register new Upala Id</a> <br />

    </div>
  );

}
