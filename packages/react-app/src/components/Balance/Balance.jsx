import React, { useState } from "react";
import { ethers } from "ethers";
import { usePoller } from "../../hooks";

export default function Balance(props) {
  const [dollarMode, setDollarMode] = useState(true);
  const [balance, setBalance] = useState();
  usePoller(
    async () => {
      if (props.address && props.provider) {
        try {
          const newBalance = await props.provider.getBalance(props.address);
          setBalance(newBalance);
        } catch (e) {
          console.log(e);
        }
      }
    },
    props.pollTime ? props.pollTime : 1999
  );

  let floatBalance = parseFloat("0.00");

  let usingBalance = balance;

  if (typeof props.balance != "undefined") {
    usingBalance = props.balance;
  }

  if (usingBalance) {
    let etherBalance = ethers.utils.formatEther(usingBalance);
    parseFloat(etherBalance).toFixed(2);
    floatBalance = parseFloat(etherBalance);
  }

  let displayBalance = floatBalance.toFixed(4);

  if (props.dollarMultiplier && dollarMode) {
    displayBalance = "$" + (floatBalance * props.dollarMultiplier).toFixed(2);
  }
  console.log(dollarMode, displayBalance, props.dollarMultiplier);
  return (
    <span
      style={{
        verticalAlign: "middle",
        cursor: "pointer",
      }}
      onClick={() => {
        console.log("test");
        setDollarMode(!dollarMode);
      }}
    >
      Balance: <b>{displayBalance}</b>
    </span>
  );
}
