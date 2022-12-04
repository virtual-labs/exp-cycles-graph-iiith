//import cytoscape from "cytoscape";
//import dagre from "cytoscape-dagre";

//cytoscape.use(dagre);

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function validatenoorder(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    var seen = {};
    a.forEach(function(v) {
        var key = (typeof v) + v;
        if (!seen[key]) {
            seen[key] = 0;
        }
        seen[key] += 1;
    });
    return b.every(function(v) {
        var key = (typeof v) + v;
        if (seen[key]) {
            seen[key] -= 1;
            return true;
        }
    });
}

function validate(a, b) {
   
    for (var i = 0; i < a.length+1; ++i) {
      if (validatehelper(a,b)) return true;
      b.push(b.shift());
      //console.log(b);
    }
    return false;
}


function validatehelper(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return true;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
}


var relation = {
    nodes: [
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5],
        [1,2,3,4]
    ],
    edges: [
        [ [1, 2,1],[2, 3,1],[1, 4,1],[2, 4,1],[2, 5,1],[3, 5,1],[4,5,1]],
        [ [1, 2,10],[2, 3,10],[1, 4,10],[2, 4,10],[2, 5,10],[3, 5,10]],
        [ [1,2,10],[1,3,15],[1,4,20],[2,3,35],[2,4,25],[3,4,30] ]
    ],

    tsc: [
        ["1-2", "2-3", "3-5", "4-5","1-4"],
        [],
        ["1-2", "2-4", "3-4","1-3"],

    ],
    pos:[
        [[1,215,85],[2,400,85],[3,215,150],[4,400,150],[5,500,200]],
        [[1,215,85],[2,400,85],[3,215,150],[4,400,150],[5,500,200]],
        [[1,215,85],[2,400,85],[3,215,150],[4,400,150]],
    ],

    trans: [
        {"1-3":"{1-2 , 2-3}", "1-4":"1-2 , 2-3 & 3-4", "1-5":"1-2 , 2-3 , 3-4 & 4-5", "2-4":"2-3 & 3-4","2-5":"2-3 , 3-4 & 4-5","3-5":"3-4 & 4-5"},
        {"1-4":"1-2 & 2-4", "1-6":"1-2 & 2-6; 1-3 & 3-6", "1-12":"1-2,2-6,6-12; 1-2,2-4,4-12; 1-3,3-6,6-12", "3-12":"3-6,6-12" },
        {"1-3":"1-2 & 2-3", "1-4":"1-2 , 2-3 & 3-4", "2-4":"2-3 & 3-4"}

    ]
};


// number of examples
var i  = getRandomInt(relation.nodes.length)

var tsc_edges = relation.tsc[i]
var cedges=[]
var trans_msg = relation.trans[i];
// Create cytoscape nodes
var cy_nodes = relation.nodes[i].map((x) => {
    return { data: { id: `${x}` } };
});

var cy_edges = relation.edges[i].map((x) => {
    return {
        data: { id: `${x[0]}-${x[1]}`, source: `${x[0]}`, target: `${x[1]}`, label: `${x[2]}`}
    };
});


//console.log(cy_edges)
const observ = document.getElementById("observations");
//const speed = document.getElementById("speed");

var cy = (window.cy = cytoscape({
    container: document.getElementById("cy"),

    layout: {
        name: "cola"
    },

    style: [
    {
        selector: "node",
        style: {
            content: "data(id)",
            "text-opacity": 0.4,
            "text-valign": "center",
            "text-halign": "right",
            "background-color": "#11479e"
        }
    },

    {
        selector: "edge",
        style: {
            "curve-style": "bezier",
            "width": 5,
            "text-margin-x":-5,
            "text-margin-y":-5,
            "text-opacity": 0.8,
            "font-size":12,
            'label': 'data(label)',
            "line-color": "#9dbaea",
            "target-arrow-color": "#9dbaea"
        }
    },
    {
        selector: "edge.black",
        style: {
            "line-color": "black",
            "target-arrow-color": "black"
        }
    },
    {
        selector: "edge.green",
        style: {
            "line-color": "green",
            "target-arrow-color": "green"
        }
    }
    ],

    elements: {
        nodes: cy_nodes,
        edges: cy_edges
    }
}));

cy.center()

/* 
cy.on("click", "edge", function (evt) {
    console.log("clicked " + this.id());
    // console.log(e);
    if (hasse_edges.includes(this.id())) {
        this.addClass("green");
    } else {
    this.addClass("red");
    }
    // console.log(this.source().id());
    // console.log(evt);
}); */

  
cy.on("tap", "edge", function (event) {
    //console.log("clicked " + this.id());
    //console.log(this.source().id(), this.target().id());
    //console.log(this.source.id==this.target.id );
    //console.log(hasse_edges,this.id)
    //console.log( this.source().id())
    
    this.addClass("black");
        //console.success('CORRECT\nedge is part of hasse diagram')
        //console.log('CORRECT: edge is part of hasse diagram','color: green');
    cedges.push(this.id())
    console.log(this.id())
    
});

document.querySelector('#submit').addEventListener('click', function() {
    console.log(cedges);
    console.log(tsc_edges);
    if(cedges.length==0 && tsc_edges.length==0){
        observ.innerHTML = "<font size=4 color=green>" +
            "<b>Correct</b>" +
            "</font>" +
            "<br>"+"Following graph does not contain any Hamiltonian Cycle, so No TSP";
    }

    else if(validate(cedges,tsc_edges) || validate(cedges.reverse(),tsc_edges)){
        if(cedges.length>2){
            //console.log(cedges)
            observ.innerHTML = "<font size=4 color=green>" +
            "<b>Correct</b>" +
            "</font>" +
            "<br>"+"It is a TSP Cycle";
        }
        
    }
    else{
        if(validatenoorder(cedges,tsc_edges)){
            observ.innerHTML =  "<font size=4 color=red>" +
            "<b>WRONG</b>" +
            "</font>" +
            "<br><br>"+"Try again!"+
            "<br><br>"+"draw the edges in correct order to form a TSP Cycle. ";
        }
        else {
            observ.innerHTML =  "<font size=4 color=red>" +
            "<b>WRONG</b>" +
            "</font>" +
            "<br><br>"+"Try again!"+
            "<br><br>"+"Wrong path";
        }
    }


        
});