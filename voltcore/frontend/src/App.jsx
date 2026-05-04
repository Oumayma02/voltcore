import React from "react";
import { legacyMarkup } from "./legacyMarkup";

export default function App() {
  return <div dangerouslySetInnerHTML={{ __html: legacyMarkup }} />;
}
