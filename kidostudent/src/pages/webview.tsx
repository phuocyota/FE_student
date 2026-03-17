import React from "react";
import { Page } from "zmp-ui";

const WEBVIEW_URL = "http://160.250.132.143:5173";

const WebViewPage = () => {
  return (
    <Page className="p-0">
      <iframe
        src={WEBVIEW_URL}
        title="webview"
        style={{ border: 0, width: "100%", height: "100vh" }}
      />
    </Page>
  );
};

export default WebViewPage;
