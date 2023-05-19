import React from "react";
import Highcharts from "highcharts";
import networkgraph from "highcharts/modules/networkgraph";
import HighchartsReact from "highcharts-react-official";

if (typeof Highcharts === "object") {
  networkgraph(Highcharts);
}

const RouteMap = ({ mapStation }) => {
  const options = {
    chart: {
      type: "networkgraph",
      height: "100%"
    },
    title: {
      text: "T"
    },

    plotOptions: {
      networkgraph: {
        keys: ["from", "to"],
        layoutAlgorithm: {
          enableSimulation: true,
          friction: -0.9
        }
      }
    },

    series: [
      {
        events: {
          click: (e) => {
            this.onClick(e);
          }
        },
        marker: {
          radius: 20
        },
        dataLabels: {
          enabled: true,
          linkFormat: "",
          allowOverlap: true
        },
        id: "lang-tree",
        data: mapStation
      }
    ]
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      // constructorType={'mapChart'}
      options={options}
      allowChartUpdate={false}
      immutable={false}
    />
  );
};

export default RouteMap;
