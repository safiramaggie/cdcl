window.onload = function() {

var displayArea = document.getElementById('test');
var formula = document.getElementById('formula');
var result = document.getElementById('result');
var assign = document.getElementById('assignment');
var width = $(document).width() - 20;
var height = $(document).height() - 60;
var nodeInfos = {};

function main() {
	readTextFile("test.cnf");
	// TODO
}

function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    
    rawFile.onreadystatechange = function ()
    {

        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                clauses = allText.split("\n");  
                var numberOfVariables = clauses[1].split(" ")[2];

                clauses.splice(0,2);
                for (var c=0; c<clauses.length; c++) {
					clauses[c] = clauses[c].split(" ");
					clauses[c].splice(clauses[c].length-1, 1);
				}
				drawFormula(clauses);
				var res = CDCL(clauses, numberOfVariables);
				result.innerText = res;
			}
		}
	}
     rawFile.send(null);
 }

function drawGraph(g){
	var layouter = new Graph.Layout.Spring(g);
	var renderer = new Graph.Renderer.Raphael('canvas', g, width, height);
}

function drawFormula(clauses) {
	var text = "";
	for (var c=0; c<clauses.length; c++) {
		text = text + "(";
		for (var l=0; l<clauses[c].length; l++) {
			text = text + clauses[c][l] + ' v ';
		}
		text = text.substring(0, text.length-3);
		text = text + ") ^ ";
	}
	text = text.substring(0, text.length-4);
	formula.innerText = text;
}
	
function CDCL (clauses, numberOfVariables) {
	var g = new Graph();
	var d = 0;
	var assignment = {};
	for (var v=1; v<=numberOfVariables; v++) {
		assignment[v] = 2; //2 = not assigned
	}
	if (UnitPropagation(clauses, assignment, g, d) == 'CONFLICT') {
		return 'Unerfuellbar';
	} else {
		var unassigned = unassignedVarExists(assignment);
		while (unassigned !== false) {
			d++;
			var random = Math.random();
			if (random < 0.5){
				assignment[unassigned] = 0;
			} else {
				assignment[unassigned] = 1;
			}
			g.addNode(unassigned+'='+assignment[unassigned], { label : 'var ' + unassigned + '= ' + assignment[unassigned] + '\n level= ' + d });
			displayArea.innerText = displayArea.innerText + " " + unassigned+'='+assignment[unassigned];
			nodeInfos[unassigned+'='+assignment[unassigned]] = {'Variable': unassigned, 'assignment': assignment[unassigned], 'mark': d};
			while (UnitPropagation(clauses, assignment, g, d) == 'CONFLICT') {		
				break;
			}		
			// d++;
			unassigned = unassignedVarExists(assignment);
			//break; //TODO break weg
		}
		assign.innerText = assignment; //TODO richtige ausgabe
		drawGraph(g);
		return 'Erfuellbar';
	}
}

function UnitPropagation (clauses, assignment, graph, level) {
	// var modified = false;
	var index = unitclauseExists(clauses, assignment);
	
	while(index !== false) {
		
		var K = clauses[index[0]][index[1]];
		var a;
		if(K.startsWith('-')) {
			a = 0;
		} else {
			a = 1;
		}
		
		var k = getVariable(K);
		
		assignment[k] = a;
		
		// modified = true;
		graph.addNode(k+'='+a, { label : 'var ' + k + ' = ' + a + '\n level= ' + level });
		nodeInfos[k+'='+a] = {'Variable': k, 'assignment': a, 'mark': level};
		K = clauses[index[0]]
		for (var l=0; l<K.length; l++) {	
			if (l==index[1]) { //falls es der neue Knoten ist
				continue;
			} else {
				displayArea.innerText = displayArea.innerText + '\n kante ' +getVariable(K[l])+"="+assignment[getVariable(K[l])]+' '+k+"="+a;
				graph.addEdge(getVariable(K[l])+"="+assignment[getVariable(K[l])], k+"="+a, { directed: true});
			}
		}
		if (formulaUnfulfilled(assignment)){
			return k+'='+a;
		}
		index = unitclauseExists(clauses, assignment);
	}
	/*if(modified && formulaUnfulfilled(assignment)) {
		return 'CONFLICT';
	}*/
	return 'NOCONFLICT';
}

function unassignedVarExists(assignment) {
	var variables = Object.keys(assignment);
	for (var k=0; k<variables.length; k++) {
		if (assignment[variables[k]] == 2) {
			return variables[k];
		}
	}
	return false;
}

function unitclauseExists (clauses, assignment) {
	for (var c=0; c<clauses.length; c++) {		
		var number = 0;
		var index;
		var fals = true;
		for (var l=0; l<clauses[c].length; l++) {
			if(assignment[getVariable(clauses[c][l])] == 2) {
				number++;
				index = l;
			} else if ((assignment[getVariable(clauses[c][l])] == 1 && !clauses[c][l].startsWith('-')) || (assignment[getVariable(clauses[c][l])] == 0 && clauses[c][l].startsWith('-'))) {
				fals = false;
			}
		}
		// falls es nur ein unbelegtes Literal gibt und alle anderen Literale falsifiziert wurden
		if (number == 1 && fals) {
			return [c,index]; //[Index der Klausel, Index des unbelegten Literals]
		}
	}
	return false;
}

function formulaUnfulfilled(clauses, assignment) {
	for (var c=0; c<clauses.length; c++) {		
		var fals = true;
		for (var l=0; l<clauses[c].length; l++) {
			if(assignment[getVariable(clauses[c][l])] == 2) {	
				fals = false;
			} else if ((assignment[getVariable(clauses[c][l])] == 1 && clauses[c][l].length == 1) || (assignment[getVariable(clauses[c][l])] == 0 && clauses[c][l].length == 2)) {
				fals = false;
			}
		}
		if (fals) {
			return true;
		}
	}
	return false;
}

function getVariable(literal) {
	if(literal.startsWith("-")) {
		return literal.substring(1,literal.length);
	} else {
		return literal;
	}
}

main();

};

