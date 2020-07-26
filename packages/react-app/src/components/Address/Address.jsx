import React, { useState, useEffect } from "react";
import Blockies from "react-blockies";
import "./Address.scss";
import { Balance } from "..";

export default function Address(props) {
  const [ens, setEns] = useState(0);
  const [dropdownActive, setDropdownActive] = useState(false);

  useEffect(() => {
    if (props.value && props.ensProvider) {
      async function getEns() {
        let newEns;
        try {
          //console.log("getting ens",newEns)
          newEns = await props.ensProvider.lookupAddress(props.value);
          setEns(newEns);
        } catch (e) {}
      }
      getEns();
    }
  }, [props.value, props.ensProvider]);

  if (!props.value) {
    return <span className="skeleton-blockie"></span>;
  }

  let displayAddress = props.value.substr(0, 6);

  if (ens) {
    displayAddress = ens;
  } else if (props.size === "short") {
    displayAddress += "..." + props.value.substr(-4);
  } else if (props.size === "long") {
    displayAddress = props.value;
  }

  let blockExplorer = "https://etherscan.io/address/";
  if (props.blockExplorer) {
    blockExplorer = props.blockExplorer;
  }

  // if (props.minimized) {
  //   return (
  //     <span style={{ verticalAlign: "middle" }}>
  //       <a style={{ color: "#222222" }} href={blockExplorer + props.value}>
  //         <Blockies seed={props.value.toLowerCase()} size={8} scale={2} />
  //       </a>
  //     </span>
  //   );
  // }

  // let text;
  // if (props.onChange) {
  //   text = (
  //     <Text
  //       editable={{ onChange: props.onChange }}
  //       copyable={{ text: props.value }}
  //     >
  //       <a style={{ color: "#222222" }} href={blockExplorer + props.value}>
  //         {displayAddress}
  //       </a>
  //     </Text>
  //   );
  // } else {
  //   text = (
  //     <Text copyable={{ text: props.value }}>
  //       <a style={{ color: "#222222" }} href={blockExplorer + props.value}>
  //         {displayAddress}
  //       </a>
  //     </Text>
  //   );
  // }
  return (
    <div className="address">
      <div
        onClick={(e) => {
          console.log("True");
          setDropdownActive(true);
        }}
      >
        <Blockies seed={props.value.toLowerCase()} size={8} scale={4} />
      </div>
      {/* <span style={{verticalAlign:"middle",paddingLeft:5,fontSize:28}}>
        {text}
      </span> */}
      {dropdownActive && (
        <div
          className="menu-overlay"
          onClick={(e) => setDropdownActive(false)}
        ></div>
      )}
      {dropdownActive && (
        <div className="toolbar-menu-box">
          <div
            className="toolbar-menu-box-item"
            onClick={(e) => {
              setDropdownActive(false);
            }}
          >
            <a
              className="toolbar-menu-box-item-title"
              href={blockExplorer + props.value}
              target="_blank"
              rel="noopener noreferrer"
            >
              {displayAddress}
            </a>
          </div>
          <div className="toolbar-menu-box-item">
            <span className="toolbar-menu-box-item-title">
              <Balance
                address={props.value}
                provider={props.injectedProvider}
                dollarMultiplier={props.dollarMultiplier}
              />
            </span>
          </div>
          <div
            className="toolbar-menu-box-item"
            onClick={(e) => {
              props.logout();
              setDropdownActive(false);
            }}
          >
            <span className="toolbar-menu-box-item-title">Logout</span>
          </div>
        </div>
      )}
    </div>
  );
}
