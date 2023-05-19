import "./styles.css";
import React, { useState } from "react";
import { Box } from "@mui/material";
import RouteMap from "./RouteMap";
import { getRouteData } from "./RouteData";

export default function App() {
  const [routeData, setRouteData] = useState(getRouteData());
  const mapStation = () => {
    let arr = [];
    const route = routeData.station;
    for (let j = 0; j < route.length; j++) {
      const station = route[j];
      const nextStation = route[j + 1];
      if (nextStation) arr.push([station.stationName, nextStation.stationName]);
    }
    console.log("test", arr);
    return arr;
  };

  const content = (key) => {
    if (key === "map") return <RouteMap mapStation={mapStation()} />;
    return null;
  };

  return <Box className="rightPaper center">{content("map")}</Box>;
}
