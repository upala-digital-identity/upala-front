import React from 'react'
import { ethers } from "ethers";
import { useContractLoader, useContractReader } from "../hooks"
import { Transactor } from "../helpers"


const upalaContractName = "Upala"

export default function Welcome(props) {

  const tx = Transactor(props.injectedProvider,props.gasPrice)
  const readContracts = useContractLoader(props.localProvider);
  const writeContracts = useContractLoader(props.injectedProvider);

  const userUpalaId = props.userUpalaId;
  const setUserUpalaId = props.setUserUpalaId

  const userUpalaIdRaw = useContractReader(readContracts,upalaContractName,"myId",[{ from: props.address }],1777);
  
  // setting Id for the first time
  if (!userUpalaId && userUpalaIdRaw) {
    setUserUpalaId(userUpalaIdRaw.toNumber());
    console.log("Setting userUpalaId", userUpalaIdRaw.toNumber());
  }

  // reseting ID TODO remove in production.
  if (userUpalaId && userUpalaIdRaw) {
    if (userUpalaId != userUpalaIdRaw.toNumber()) {
      setUserUpalaId(userUpalaIdRaw.toNumber());
      console.log("Setting userUpalaId", userUpalaIdRaw.toNumber());
    }
  }

  let displayUserID = "Not registered";
  if (userUpalaId) {
    displayUserID = userUpalaId;
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

      <a onClick={()=>{
              tx(
                writeContracts[upalaContractName]
                  .newIdentity(props.address, { gasLimit: ethers.utils.hexlify(400000) })
                )
            }}>Register new Upala Id</a> <br />

      {/* <a onClick={()=>{
              readContracts[upalaContractName].myId({ from: props.address }).then((result) => {
                console.log("myId button result", result.toNumber());
              });
            }}>My Id</a> */}

    </div>
  );

}
