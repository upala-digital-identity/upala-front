import React from "react";
import "./Logo.scss";

export default function Logo() {
  return (
    <div className="logo">
      {/* <PageHeader
        title="🔵 Upala Wallet"
        subTitle="Price-of-forgery digital identity"
        style={{ cursor: "pointer" }}
      />
      <div> */}
      <span role="img" aria-label="icon" className="logo-span">
        🔵
      </span>{" "}
      <span>upala</span>
      {/* </div> */}
    </div>
  );
}
