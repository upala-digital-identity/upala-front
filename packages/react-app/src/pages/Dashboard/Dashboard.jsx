import React, { useState, useEffect } from "react";

import { Logo, Account } from "../../components";
import { GroupsList } from "../../components/groups";
import { Search } from "react-feather";
import "./Dashboard.scss";
import { useHistory } from "react-router-dom";
import { UpalaWallet, EthereumGateway } from "../../models";
import { ethers } from "ethers";
import Loader from "react-loader-spinner";

import {
  membership_status,
  INFURA_ID,
  IS_SHIPPED,
  network,
} from "../../config";
import { useExchangePrice, ActionContext, StateContext } from "../../hooks";

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
const ethereumGateway = new EthereumGateway(network);

var upalaWallet;
// var upalaProtocol;

export default function Dashboard(props) {
  const { loadAllGroups, loadUserUpalaId, loadUserAddress } = React.useContext(
    ActionContext
  );
  const { allGroups, userUpalaId, userAddress } = React.useContext(
    StateContext
  );
  const history = useHistory();
  // const [activeGroupID, setActiveGroupID] = useState();
  // const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [loading, setLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const price = useExchangePrice(mainnetProvider);
  // const gasPrice = useGasPrice("fast");

  // const [userUpalaId, setUserUpalaId] = useState();
  // const [loadedGroups, setLoadedGroups] = useState();

  // const contracts = useContractLoader(injectedProvider);
  // const globalDAIContract = contracts ? contracts[daiContractName] : null;

  // TODO does not update on changing account in metamask
  useEffect(() => {
    async function initializeUpala(provider) {
      // console.log("Here", provider);
      if (typeof provider !== "undefined") {
        await ethereumGateway.updateProvider(provider);
        // console.log("Completed");
        upalaWallet = new UpalaWallet(
          ethereumGateway,
          loadUserUpalaId,
          loadAllGroups
        );
        if (!userUpalaId) {
          upalaWallet.loadUserID(setLoading);
        } else {
          setLoading(false);
        }
      }
    }
    initializeUpala(injectedProvider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectedProvider]);

  const setActiveGroupID = (groupId) => {
    history.push("/groups/details/" + groupId);
  };

  console.log(allGroups);
  return (
    <div className="dashboard">
      {/* <header>
        <Logo />
        <div
          style={{
            position: "fixed",
            textAlign: "right",
            right: 0,
            top: 0,
            padding: 10,
          }}
        >
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
          {activeGroupID ? (
            <GroupDetails activeGroup={loadedGroups[activeGroupID]} />
          ) : (
            ""
          )}
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

      {!IS_SHIPPED ? (
        <div
          style={{
            position: "fixed",
            textAlign: "left",
            left: 0,
            bottom: 20,
            padding: 10,
          }}
        >
          <Faucet localProvider={localProvider} />
        </div>
      ) : (
        ""
      )} */}
      <div className="dashboard-header">
        <span
          className="dashboard-header-menu"
          onClick={() => history.push("/groups/search")}
        >
          <Search />
        </span>
        <span className="dashboard-header-logo">
          <Logo />
        </span>
        <span className="dashboard-header-search">
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
      <div className="dashboard-body-container">
        {loading ? (
          <div className="dashboard-loader-container">
            <Loader type="Grid" color="#6314ff" height={64} width={64} />
          </div>
        ) : userUpalaId ? (
          <>
            {/* <div className="dashboard-score-container">
              <span className="dashboard-score-text">Your max. score is</span>
              <span className="dashboard-score-amount">15 DAI</span>
            </div> */}
            <div className="dashboard-groups-container">
              <div className="dashboard-groups-title">Groups</div>
              <GroupsList
                loadedGroups={allGroups}
                statusFilter={[
                  membership_status.JOINED,
                  membership_status.PENDING_JOIN,
                ]}
                setActiveGroupID={setActiveGroupID}
              />
              {/* <div className="dashboard-groups-title">Paths</div>
              <GroupsList
                loadedGroups={allGroups}
                statusFilter={membership_status.PENDING_JOIN}
                setActiveGroupID={setActiveGroupID}
              /> */}
            </div>
          </>
        ) : (
          <div className="dashboard-register-container">
            <div className="get-started-content">
              You are not a registered user, Please register yourself to get a
              new ID
            </div>
            <div>
              <button
                className="get-started-button"
                type="button"
                onClick={() => {
                  setRegisterLoading(true);
                  upalaWallet.registerUser(setRegisterLoading);
                }}
              >
                {registerLoading ? (
                  <Loader
                    type="Oval"
                    color="#FFF"
                    height={30}
                    width={30}
                    style={{ display: "flex" }}
                  />
                ) : (
                  "Register ID"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
