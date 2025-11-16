import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  componentDidUpdate() {
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);

    if (!chartData || chartData.length === 0) {
      return;
    }

    const svg = d3.select(".svg_parent");
    svg.selectAll("*").remove(); //clear previous render

    const width = 500;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 60, left: 40 };

    // LLM model keys
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    const colors = { 
      "GPT-4": "#e41a1c", 
      "Gemini": "#377eb8", 
      "PaLM-2": "#4daf4a", 
      "Claude": "#984ea3", 
      "LLaMA-3.1": "#ff7f00" 
    };

    //convert CSV rows to usable numeric/time data
    const parsedData = chartData.map(d => {
      const row = { Date: new Date(d.Date) };
      llmModels.forEach(key => {
        row[key] = +d[key]; //+ means convert to numeric
      });
      return row;
    });

    //maximum summed height for y domain
    const maxSum = d3.max(
      parsedData.map(d => 
        llmModels.reduce((acc, key) => acc + d[key], 0)
      )
    );

    //x scale
    var xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.Date))
      .range([0, width - margin.left - margin.right]);

    //y scale
    var yScale = d3.scaleLinear()
      .domain([0, maxSum])
      .range([height - margin.top - margin.bottom, 0]);

    //stack generator
    var stack = d3.stack()
      .keys(llmModels)
      .offset(d3.stackOffsetWiggle);

    var stackedSeries = stack(parsedData);

    var areaGenerator = d3.area()
      .x(d => xScale(d.data.Date))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCardinal);

    const container = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top + 10})`);

    //draw stream layers
    container.selectAll("path")
      .data(stackedSeries)
      .join("path")
      .attr("fill", d => colors[d.key])
      .attr("d", areaGenerator);

    //bottom of graph
    const minY0 = d3.min(stackedSeries, layer =>
      d3.min(layer, d => d[0])
    );
    const graphBottom = yScale(minY0);

    //x-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d3.timeFormat("%b"));  //month names

    container.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${graphBottom + 10})`)
      .call(xAxis);

  }

  render() {
    return (
      <svg style={{ width: 600, height: 600 }} className="svg_parent"></svg>
    );
  }
}

export default InteractiveStreamGraph;
