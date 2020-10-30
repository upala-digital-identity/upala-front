import React, { useState } from "react";
import { ArrowLeft } from "react-feather";
import "./GroupInfo.scss";
import { useHistory, useParams } from "react-router-dom";
import { StateContext, ActionContext } from "../../hooks";
import { IS_SHIPPED, INFURA_ID } from "../../config";
import { Logo, Account } from "../../components";
import { ethers } from "ethers";
import { GroupDetails } from "../../components/groups";

// mainnetProvider is used for price discovery
const mainnetProvider = new ethers.providers.InfuraProvider(
  "mainnet",
  INFURA_ID
);
const localProvider = new ethers.providers.JsonRpcProvider(
  process.env.REACT_APP_PROVIDER
    ? process.env.REACT_APP_PROVIDER
    : "http://localhost:8545"
);

export default function GroupInfo() {
  const history = useHistory();
  const { id } = useParams();

  const { allGroups, userAddress } = React.useContext(StateContext);
  const { loadUserAddress } = React.useContext(ActionContext);
  // const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const price = 380;

  const selectedGroup = allGroups[id];

  return (
    <div className="group-info">
      <div className="group-info-header">
        <span
          className="group-info-header-menu"
          onClick={() => history.goBack()}
        >
          <ArrowLeft />
        </span>
        <span className="group-info-header-logo">
          <Logo />
        </span>
        <span className="group-info-header-search">
          <Account
            address={userAddress}
            setAddress={loadUserAddress}
            localProvider={IS_SHIPPED ? injectedProvider : localProvider}
            injectedProvider={injectedProvider}
            setInjectedProvider={setInjectedProvider}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </span>
      </div>
      <div className="group-info-body-container">
        <GroupDetails activeGroup={selectedGroup} />
      </div>
    </div>
  );
}
