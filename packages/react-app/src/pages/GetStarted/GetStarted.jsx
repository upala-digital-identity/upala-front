import React from "react";
import "./GetStarted.scss";
import { Logo } from "../../components";
import { useHistory } from "react-router-dom";

export default function GetStarted(props) {
  const history = useHistory();

  return (
    <div className="get-started">
      <div className="get-started-header">
        <Logo />
      </div>
      <div className="get-started-content">
        Get your digital identity uniqueness score.
      </div>
      <div className="get-started-button-container">
        <button
          className="get-started-button"
          type="button"
          onClick={() => history.push("/dashboard")}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
