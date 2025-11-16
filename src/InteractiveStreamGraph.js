import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {

  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.tooltipSvg = null;
    this.previousModel = null;
    this.tooltip = null;
  }

  componentDidUpdate() {
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);

    if (!chartData || chartData.length === 0) {
      return;
    }

    const svg = d3.select(this.svgRef.current);
    svg.selectAll(".graph").remove(); // clear previous graph only

    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const width = 500;
    const height = 500;

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
      .attr("class", "graph")
      .attr("transform", `translate(${margin.left - 20}, ${margin.top + 10})`);

    //draw stream layers
    const layers = container.selectAll("path")
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
    
    //legend
    var legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + margin.right - 10}, ${margin.top + 100})`); 

    const legendItems = legend.selectAll(".legend-item")
      .data([...llmModels].reverse())
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", d => colors[d]);

    legendItems.append("text")
      .attr("x", 24)
      .attr("y", 14)
      .style("font-size", "14px")
      .text(d => d);

    //tooltip
    if (!this.tooltip) {
      this.tooltip = d3.select("body").select(".tooltip");
      if (this.tooltip.empty()) {
        this.tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "white")
          .style("border", "1px solid #ccc")
          .style("padding", "10px")
          .style("border-radius", "4px");
      }
    }

    const tooltipWidth = 350;
    const tooltipHeight = 200;
    const tooltipMargin = { top: 20, right: 20, bottom: 30, left: 30 };

    if (!this.tooltipSvg) {
      this.tooltipSvg = this.tooltip.append("svg")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight);
    }
    const miniSvg = this.tooltipSvg;

    layers.on("mouseover", (event, d) => {
      const model = d.key;
      const prev = this.previousModel;

      this.tooltip
        .style("opacity", 1)
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 10}px`);

      //clear only bars and axes
      miniSvg.selectAll(".bars").remove();
      miniSvg.selectAll(".axis-x").remove();
      miniSvg.selectAll(".axis-y").remove();

      //x scale
      const miniX = d3.scaleBand()
        .domain(parsedData.map(d => d3.timeFormat("%b")(d.Date)))
        .range([tooltipMargin.left, tooltipWidth - tooltipMargin.right])
        .padding(0.1);

      //y scale
      const miniY = d3.scaleLinear()
        .domain([0, d3.max(parsedData, d => d[model])])
        .range([tooltipHeight - tooltipMargin.bottom, tooltipMargin.top]);

      miniSvg.append("g")
        .attr("class", "bars")
        .selectAll("rect")
        .data(parsedData, d => d.Date)
        .join("rect")
        .attr("x", d => miniX(d3.timeFormat("%b")(d.Date)))
        .attr("width", miniX.bandwidth())
        .attr("y", d => miniY(d[model]))
        .attr("height", d => miniY(0) - miniY(d[model]))
        .attr("fill", prev ? colors[prev] : colors[model])
        .transition()
        .duration(600)
        .attrTween("fill", () => {
          const start = prev ? colors[prev] : colors[model];
          return d3.interpolateRgb(start, colors[model]);
        });

      //axes
      miniSvg.append("g")
        .attr("class", "axis-x")
        .attr("transform", `translate(0, ${tooltipHeight - tooltipMargin.bottom})`)
        .call(d3.axisBottom(miniX).tickSizeOuter(0));

      miniSvg.append("g")
        .attr("class", "axis-y")
        .attr("transform", `translate(${tooltipMargin.left}, 0)`)
        .call(d3.axisLeft(miniY).ticks(5));

      this.previousModel = model;
    });

    layers.on("mousemove", (event) => {
      this.tooltip.style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 10}px`);
    });

    layers.on("mouseout", () => {
      this.tooltip.style("opacity", 0)
    });

  }

  render() {
    return (
      <svg ref={this.svgRef} style={{ width: 600, height: 600 }} className="svg_parent"></svg>
    );
  }
}

export default InteractiveStreamGraph;
