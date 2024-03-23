// for each student, linearize all steps across all problems
// and calculate duration for each step
function processStudentData(d, problems) {
  let allData = [];
  let attemptedProblems = [];

  for (let problem of problems) {
    let problemData = d[problem];

    if (problemData.length === 1) {
      continue;
    }

    allData = allData.concat(problemData);
    attemptedProblems.push(problem);

  }

  let previousEnd = 0;
  let stepChange = [];

  for (let i = 0; i < allData.length; i++) {
    let step = allData[i];

    // if (step.action == "start new problem") {
    //   if (i == 0) {
    //     // If this is the first step, go to next step
    //     step["duration"] = 0;
    //     step["start"] = 0;
    //     step["end"] = 0;
    //     continue;
    //   } else {
    //     // If this is not the first step, increment previousEnd
    //     let startTime = new Date(step["time"]);
    //     // let normalizedStartTime = previousEnd

    //     let lastStep = allData[i-1];
    //     let lastStepTime = new Date(lastStep["time"]);
    //     let duration = startTime - lastStepTime;

    //     previousEnd = previousEnd + duration;

    //     step["duration"] = 0;
    //     step["start"] = previousEnd;
    //     step["end"] = previousEnd;
    //     continue;
    //   }
    // }

    if (step.action == "start new problem") {
      step["duration"] = 0;
      step["start"] = 0;
      step["end"] = 0;
      previousEnd = 0;
    } else {
      let startTime = new Date(step["time"]);

      let lastStep = allData[i-1];
      let lastStepTime = new Date(lastStep["time"]);
      let duration = startTime - lastStepTime;
      step["duration"] = duration;
      step["start"] = previousEnd;
      step["end"] = previousEnd + duration;

      previousEnd = previousEnd + duration;

      if (lastStep.selection !== step.selection
          && lastStep.kc_labels !== step.kc_labels
          && lastStep.action !== "start new problem") {
        stepChange.push(step);
      }
    }
  }

  return [allData, attemptedProblems, stepChange];
}

// render visualization for selected student
function renderStudent(data, problems) {
  let [processed_data, attempted_problems, step_change] = processStudentData(data, problems);

  let svg = d3.select("#temporal");

  let canvas = {"height": attempted_problems.length * 30 + 75,
          "width": $("#temporal").parent().width() * 0.8,
          "marginLeft": 120,
          "marginTop": 50,
          "marginRight": 100,
          "marginBottom": 25}

  svg.attr("height", canvas.height)
    .attr("width", canvas.width);

  const zoom = d3.zoom()
    .scaleExtent([1, 10000])
    .on("zoom", zoomed);

  svg.on('click', function(e) {
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);

    e.stopPropagation();
  })

  d3.select("#clip-rect")
    .attr("x", canvas.marginLeft - 10)
    .attr("y", 0)
    .attr("height", canvas.height)
    .attr("width", canvas.width - canvas.marginLeft - canvas.marginRight + 30);

  let yScale = d3.scaleBand()
    .domain(attempted_problems)
    .range([canvas.marginTop, canvas.height-canvas.marginBottom]);

  let xScale = d3.scaleLinear()
    .domain([d3.min(processed_data, d => d["start"]), d3.max(processed_data, d => d["end"])])
    .range([canvas.marginLeft, canvas.width - canvas.marginRight])

  let tooltip = d3.select("#tooltip")
            .style("position", "fixed")
            .style("visibility", "hidden")
            .style("font-size", "8px")
            .style("border", "solid 1px black")
            .style("border-radius", "2.5px")
            .style("padding", "5px")
            .style("background-color", "white")
            .text("");

  let vis_container = d3.select("#vis-container");

  // Add bar for each bin
  vis_container.selectAll(".bar")
    .data(processed_data)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d["start"])
      )
    .attr("width", d => xScale(d['end']) - xScale(d['start']))
    .attr("y", d => yScale(d["problem"]) + 5)
    .attr("height", yScale.bandwidth() - 10)
    .attr("fill", d => {
      if (d["correctness"] == "CORRECT") {
        return "#c0d186"
      } else if (d["correctness"] == "INCORRECT") {
        // console.log(d.problem, d.correctness);
        return "#ed8b80"
      } else if (d["correctness"] == "HINT") {
        return "#ffd68a"
      } else {
        return "#bdbdbd"
      }
    })
    .attr("stroke", d => {
      if (d["correctness"] == "CORRECT") {
        return "#c0d186"
      } else if (d["correctness"] == "INCORRECT") {
        // console.log(d.problem, d.correctness);
        return "#ed8b80"
      } else if (d["correctness"] == "HINT") {
        return "#ffd68a"
      } else {
        return "#bdbdbd"
      }
    })
    .attr("stroke-width", "1px")
    .on("mouseover", function() {
      return tooltip.style("visibility", "visible"); })
    .on("mousemove", function(d) {

      let xPos = xScale(d.start + d.duration / 2)
      let yPos = yScale(d.problem) - yScale.bandwidth()
      let kc = d.kc_labels == "" ? "-" : d.kc_labels.split("'")[1]
      let selection = d.selection
      let input = d.input
      return tooltip.style("left", (d3.event.pageX).toString() + "px")
              .style("top", (d3.event.pageY - 50).toString() + "px")
              .html("<strong>Knowledge Component:</strong> " + kc + "<br><strong>Selection:</strong> " + selection +"<br><strong>Input:</strong> " + input) ; })
    .on("mouseout", function() {
      return tooltip.style("visibility", "hidden"); });

  let start_only = processed_data.filter(d => d.action == "start new problem");

  let start_points = d3.select("#start-points");

  // Add start time indicator for each student
  start_points.selectAll(".start")
    .data(start_only)
    .join("circle")
    .attr("class", "start")
    .attr("cx", d => xScale(d["start"]))
    .attr("cy", d => yScale(d["problem"]) + yScale.bandwidth() / 2)
    .attr("r", 5)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "2px");

  let complete_only = processed_data.filter(d => d.selection == "done" && d.correctness == "CORRECT");

  let complete_points = d3.select("#complete-points");

  // Add problem completion indicator for each student
  start_points.selectAll(".complete")
    .data(complete_only)
    .join("text")
    .attr("class", "complete")
    .attr("x", d => xScale(d["end"]) + 10)
    .attr("y", d => yScale(d["problem"]) + yScale.bandwidth() / 2 + 6)
    .attr("fill", "black")
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .text("*");

  let step_lines = d3.select("#step-change");

  console.log(step_change);

  // Add step change indicator for each student
  step_lines.selectAll(".change")
    .data(step_change)
    .join("line")
    .attr("class", "change")
    .attr("x1", d => xScale(d["start"]))
    .attr("x2", d => xScale(d["start"]))
    .attr("y1", d => yScale(d["problem"]) + 4.5)
    .attr("y2", d => yScale(d["problem"]) + yScale.bandwidth() - 4.5)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "2px");

  svg.selectAll(".legendrect")
    .data(["incorrect", "correct", "hint"])
    .join("rect")
    .attr("class", "legendrect")
    .attr("x", canvas.width - canvas.marginRight + 12)
    .attr("y", (d, i) => canvas.marginTop + 15 * i)
    .attr("height", 10)
    .attr("width", 10)
    .attr("fill", d => {
      if (d == "correct") {
        return "#c0d186"
      } else if (d == "incorrect") {
        return "#ed8b80"
      } else if (d == "hint") {
        return "#ffd68a"
      } else {
        return "#bdbdbd"
      }
    });

  svg.selectAll(".legendtext")
    .data(["incorrect", "correct", "hint"])
    .join("text")
    .attr("class", "legendtext")
    .attr("x", canvas.width - canvas.marginRight + 25)
    .attr("y", (d, i) => canvas.marginTop + 15 * i + 7)
    .text(d => d)
    .attr("alignment-baseline", "middle")
    .attr("font-size", 8);

  let gy = svg.select('#y-axis');
  let yAxis = d3.axisLeft(yScale).tickSize(3).ticks(5).tickPadding([10]);
  gy.transition()
    .attr('transform', `translate(${canvas.marginLeft}, 0)`)
    .call(yAxis);

  function formatTime(t) {
    let seconds = t/1000

    if (seconds >= 86400) {
      let days = Math.floor(seconds/86400)
      let r = seconds - days * 86400

      let hours = Math.floor(r/3600)

      return days.toString() + 'days ' + hours.toString() + 'h'
    } else if (seconds >= 3600) {
      let hours = Math.floor(seconds/3600)
      let r = seconds - hours * 3600

      let minutes = Math.floor(r/60)

      return hours.toString() + 'h ' + minutes.toString() + 'mins'
    } else if (seconds >= 60) {
      let minutes = Math.floor(seconds/60)
      let r = seconds - minutes * 60

      return minutes.toString() + 'mins ' + r.toString() + 's'
    } else {
      return seconds.toString() + 's'
    }
  }

  let gx = svg.select('#x-axis');
  let xAxis = d3.axisBottom(xScale).tickSize(3).ticks(10).tickFormat(formatTime);
  gx.transition()
    .attr('transform', `translate(0, ${canvas.height - canvas.marginBottom})`)
    .call(xAxis);

  function zoomed() {
    let transform = d3.event.transform;
    xScale.range([canvas.marginLeft, canvas.width - canvas.marginRight].map(d => transform.applyX(d)));
    svg.selectAll(".bar").attr("x", d => xScale(d["start"]))
              .attr("width", d => xScale(d['end']) - xScale(d['start']));
    svg.selectAll(".start").attr("cx", d => xScale(d["start"]));
    svg.selectAll(".change").attr("x1", d => xScale(d["start"]))
              .attr("x2", d => xScale(d["start"]));
    svg.selectAll(".complete").attr("x", d => xScale(d["end"]) + 10);
    gx.call(xAxis.scale(transform.rescaleX(xScale)));
  }

  svg.call(zoom).call(zoom.transform, d3.zoomIdentity);
}

// process data and render based on whether student or problem is selected
function renderTemporal(data, id, view_by="student"){

  if (view_by === "student") {
    processed_data = data[id];
    renderStudent(processed_data, Object.keys(processed_data));
  } else if (view_by === "problem") {
    // processed_data = processed[0][id];
    // continue;
  }          
}