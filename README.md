# Interactive Streamgraph

This application allows users to upload a CSV file. It then renders an **interactive streamgraph** with tooltips displaying **mini bar charts** for each stream. The bar charts dynamically update and smoothly **fade colors** when hovering between streams.

---

## Features

* Interactive streamgraph of CSV data
* Hover over streams to see mini bar charts in tooltips
* Smooth color fading transitions between bars
* X-axis displays months; Y-axis scales dynamically
* Fully implemented as a **React class component** using **D3.js**
* Interactive legend showing stream colors

---

## Demo / Walkthrough

<img src='https://github.com/snic29/streamgraph/blob/master/Streamgraph.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/snic29/streamgraph.git
cd streamgraph
```

2. Install dependencies:

```bash
npm install
```

3. Run the project:

```bash
npm start
```

---

## CSV Data Format

The CSV should have a **Date column** and one column per stream:

| Date       | GPT-4 | Gemini | PaLM-2 | Claude | LLaMA-3.1 |
| ---------- | ----- | ------ | ------ | ------ | --------- |
| 2024-01-01 | 23    | 45     | 12     | 34     | 20        |
| 2024-02-01 | 25    | 50     | 15     | 30     | 22        |

* `Date` format must be compatible with `new Date()`.
* Values must be numeric.
