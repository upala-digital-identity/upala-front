import React, { useState, useEffect, useRef } from "react";
import { network, PORTIS_ID, INFURA_ID } from "../../config";
import Portis from "@portis/web3";
import { ethers } from "ethers";
// import BurnerProvider from 'burner-provider';
import Web3Modal from "web3modal";
import { Address } from "..";
import { usePoller, useContractLoader } from "../../hooks";
// import { useContractReader } from "../../hooks";

import WalletConnectProvider from "@walletconnect/web3-provider";
import { Button } from "antd";
// import { daiContractName } from "../../config";

const web3Modal = new Web3Modal({
  //network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
    portis: {
      package: Portis, // required
      options: {
        id: PORTIS_ID, // required
        network: network,
      },
    },
  },
});

export default function Account(props) {
  const pollInjectedProvider = async () => {
    if (props.injectedProvider) {
      let accounts = await props.injectedProvider.listAccounts();
      if (accounts && accounts[0] && accounts[0] !== props.account) {
        //console.log("ADDRESS: ",accounts[0])
        if (typeof props.setAddress == "function")
          props.setAddress(accounts[0]);
      }
    }
  };
  usePoller(
    () => {
      pollInjectedProvider();
    },
    props.pollTime ? props.pollTime : 1999
  );

  const loadWeb3Modal = async () => {
    const provider = await web3Modal.connect();
    //console.log("GOT CACHED PROVIDER FROM WEB3 MODAL",provider)
    props.setInjectedProvider(new ethers.providers.Web3Provider(provider));
    pollInjectedProvider();
  };

  const logoutOfWeb3Modal = async () => {
    web3Modal.clearCachedProvider();
    //console.log("Cleared cache provider!?!",clear)
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  // let modalButtons = [];

  // if (web3Modal.cachedProvider) {
  //   modalButtons.push(
  //     <Button
  //       key="logoutbutton"
  //       style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
  //       shape={"round"}
  //       size={"large"}
  //       onClick={logoutOfWeb3Modal}
  //     >
  //       logout
  //     </Button>
  //   );
  // } else {
  //   modalButtons.push(
  //     <Button
  //       key="loginbutton"
  //       style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
  //       shape={"round"}
  //       size={"large"}
  //       type={"primary"}
  //       onClick={loadWeb3Modal}
  //     >
  //       connect
  //     </Button>
  //   );
  // }
  // console.log("Web3", web3Modal.cachedProvider, modalButtons);

  React.useEffect(() => {
    const loading = async () => {
      if (web3Modal.cachedProvider) {
        loadWeb3Modal();
      }
    };
    loading();
  }, []);

  // let userBalance;
  // const readContracts = useContractLoader(props.localProvider);
  // userBalance = useContractReader(readContracts,daiContractName,"balanceOf",[props.address],5000);
  // let displayUserBalance = userBalance
  //   ? ethers.utils.formatEther(userBalance)
  //   : "Loading...";

  return (
    <div>
      {/* {props.address ? (
        <Address value={props.address} ensProvider={props.mainnetProvider} />
      ) : (
        "Connecting..."
      )}
      
      {modalButtons} */}
      {web3Modal.cachedProvider ? (
        <Address
          value={props.address}
          size={"short"}
          ensProvider={props.mainnetProvider}
          logout={logoutOfWeb3Modal}
          provider={props.injectedProvider}
          dollarMultiplier={props.price}
        />
      ) : (
        <Button
          key="loginButton"
          shape={"round"}
          size={"default"}
          type={"primary"}
          onClick={loadWeb3Modal}
        >
          Connect
        </Button>
      )}
    </div>
  );
}
