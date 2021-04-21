d3.csv("https://raw.githubusercontent.com/Rphad/Decentraland-Online-Users/main/activity_history.csv", function(err, rows){

  function unpack(rows, key) {
    console.log(rows[0].TIME)
    console.log(key)
    if (key=="TIME") {
      return rows.map(function(row) {return new Date(row[key]*1000);});
    } else {
      return rows.map(function(row) { return row[key]; });
    }
  }


  var trace = {
    type: "scatter",
    mode: "lines",
    name: 'Online users',
    x: unpack(rows, 'TIME'),
    y: unpack(rows, 'PLAYERS'),
    line: {color: '#7F7F7F'}
  }
  console.log(trace);
  var data = [trace]

  var layout = {
    title: {
      text:'Online users in Decentraland'
    },
    xaxis: {
      title: {
        text: 'Time (UTC)',
      },
    },
    yaxis: {
      title: {
        text: 'Number of players',
      }
    }
  };

  Plotly.newPlot('myDiv', data, layout);
})


window.addEventListener('resize', updatePlotlyLayout);

function updatePlotlyLayout() {
  var update = {
    width: window.innerWidth * 0.99,
    height: window.innerHeight *0.6
  }
  Plotly.relayout('myDiv', update);
}
