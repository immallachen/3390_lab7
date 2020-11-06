var margin = ({top: 20, right: 20, bottom: 20, left: 20});
var width = 900 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svg2 = d3.select(".chart-2").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var visType = "force", simulation, projection, map, link, node;

d3.selectAll("input[name=type]").on("change", event=>{
        visType = event.target.value;// selected button
        switchLayout();
    });

d3.json('airports.json').then(data =>{
    d3.json('world-110m.json').then(wordmap=>{
        // do something
        console.log(wordmap);
        const geomap = topojson.feature(wordmap, wordmap.objects.countries);
        console.log(geomap);

        projection = d3.geoMercator()
            .fitExtent([[0,0], [width,height]], geomap);

        const path = d3.geoPath()
            .projection(projection);

        map = svg.append("path")
            .attr("d", path(geomap))
            .style("opacity", 0);

        console.log(topojson.mesh(wordmap, wordmap.objects.land));

        svg.append("path")
            .datum(topojson.mesh(wordmap, wordmap.objects.land))
            .attr("d", path)
            .attr('fill', 'none')
            .attr('stroke', 'white')
            .attr("class", "subunit-boundary");


        console.log(data);

        const circleScale = d3
            .scaleLinear()
            .domain([d3.min(data.nodes, d => d.passengers), d3.max(data.nodes, d => d.passengers)])
            .range([8, 15]);
    
        simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.index))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX())
            .force("y", d3.forceY());
    
        link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke-width", "2px");
    
        node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", d => circleScale(d.passengers))
            .attr("fill", "orange")
            .call(drag(simulation));
        
        node.append("title")
            .text(d => d.name);
    
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });
    });
});

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.2).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
        .filter(event => visType === "force");
}

function switchLayout() {
    if (visType === "map") {
        // stop the simulation
        simulation.stop();
        // set the positions of links and nodes based on geo-coordinates
        node
            .merge(node)
            .transition()   
            .delay(200)  
            .duration(1000)
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1]);
            
        link
            .merge(link)
            .transition()   
            .delay(200)  
            .duration(1000)
            .attr("x1",d => projection([d.source.longitude, d.source.latitude])[0])
            .attr("y1", d => projection([d.source.longitude, d.source.latitude])[1])
            .attr("x2", d => projection([d.target.longitude, d.target.latitude])[0])
            .attr("y2", d => projection([d.target.longitude, d.target.latitude])[1]);
        // set the map opacity to 1
        map.style("opacity", 1);

      } else { 
            // force layout
            link
                .merge(link)
                .transition()   
                .delay(200)  
                .duration(1000)
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        
            node
                .merge(link)
                .transition()   
                .delay(200)  
                .duration(1000)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            // restart the simulation
            // set the map opacity to 0
            map.style("opacity", 0);
      }
  }