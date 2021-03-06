window.onload = function() {

var formulaField = document.getElementById('formula');
var resultField = document.getElementById('result');
var assignField = document.getElementById('assignment');
var graphsField = document.getElementById('graphs')
var width = $(document).width() - 20;
var height = $(document).height() - 140;
var id = 0;

function main() {
	// Example from the script
	readTextFile("test.cnf", true);

	var ending = ".cnf";

	var sat5_28 = "SAT-Formeln/SAT-Formeln/sat-5-28/sat-5-28-";
	var sat5_28_size = 692;
	var sat10_50 = "SAT-Formeln/SAT-Formeln/sat-10-50/sat10-50-";
	var sat10_50_size = 485;
	var unsat5_28 = "SAT-Formeln/SAT-Formeln/unsat-5-28/unsat-5-28-";
	var unsat5_28_size = 309;
	var unsat10_50 = "SAT-Formeln/SAT-Formeln/unsat-10-50/unsat10-50-";
	var unsat10_50_size = 479;

	// sat 5-28
	for(var i=1; i<=sat5_28_size; i++) {
		var fileName = sat5_28 + i + ending;
		if(readTextFile(fileName, false) == 'Unerfuellbar') {
			alert('Fehler in sat-5-28-Formel ' + i);
		}
	}
	alert('SAT-5-28 abgeschlossen!');
	// sat 10-50
	for(var i=1; i<=sat10_50_size; i++) {
		var fileName = sat10_50 + i + ending;
		if(readTextFile(fileName, false) == 'Unerfuellbar') {
			alert('Fehler in sat-10-50-Formel ' + i);
		}
	}
	alert('SAT-10-50 abgeschlossen!');
	// unsat 5-28
	for(var i=1; i<=unsat5_28_size; i++) {
		var fileName = unsat5_28 + i + ending;
		if(readTextFile(fileName, false) == 'Erfuellbar') {
			alert('Fehler in unsat-5-28-Formel ' + i);
		}
	}
	alert('UNSAT-5-28 abgeschlossen!');
	// unsat 10-50
	for(var i=1; i<=unsat10_50_size; i++) {
		var fileName = unsat10_50 + i + ending;
		if(readTextFile(fileName, false) == 'Erfuellbar') {
			alert('Fehler in unsat-10-50-Formel ' + i);
		}
	}
	alert('UNSAT-10-50 abgeschlossen!');
	alert('Alle Tests abgeschlossen.');
}

function readTextFile(file, drawOutput)
{
		var res;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);

    rawFile.onreadystatechange = function ()
    {

        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                allText = allText.split("\n");

                var numberOfVariables = allText[1].split(" ")[2];

                allText.splice(0,2);

                var clauses = [];
                for (var c=0; c<allText.length; c++) {
					if(allText[c].length > 0) {
						var split = allText[c].split(" ");
						split.splice(split.length-1, 1);
						clauses.push(split);
					}
				}
				if(drawOutput) {
					formulaField.innerText = drawFormula(clauses);
				}
				res = CDCL(clauses, numberOfVariables, drawOutput);
				if(drawOutput) {
					resultField.innerText = res;
				}
			}
		}
	}
   rawFile.send(null);
	 return res;
 }

function drawGraph(nodeInfos, edgeInfos){
	id++
	graphsField.innerHTML = graphsField.innerHTML + "\n\n<div id=\"canvas"+id+"\"></div>";
	var graph = new Graph();
	var nodes = Object.keys(nodeInfos);
	for(var n = 0; n< nodes.length; n++) {
		graph.addNode(nodes[n], { label : 'var ' + nodeInfos[nodes[n]].Variable + '= ' + nodeInfos[nodes[n]].assignment + '\n level= ' + nodeInfos[nodes[n]].mark });
	}
	for(var e = 0; e < edgeInfos.length; e++) {
		graph.addEdge(edgeInfos[e].from, edgeInfos[e].to, {directed: true});
	}
	var layouter = new Graph.Layout.Spring(graph);
	var renderer = new Graph.Renderer.Raphael('canvas'+id, graph, width, height);
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
	text = text.substring(0, text.length-3);
	return text;
}

function drawAssignment(assignment) {
	var as = Object.keys(assignment);
	var text = '';
	for (var a = 0; a < as.length; a++) {
		text = text + as[a] + '=' + assignment[as[a]]+'; ';
	}
	return text;
}

function CDCL (clauses, numberOfVariables, drawOutput) {
	var nodeInfos = {};
	var edgeInfos = [];
	var d = 0;
	var assignment = {};
	for (var v=1; v<=numberOfVariables; v++) {
		assignment[v] = 2; //2 = not assigned
	}

	// Zeile 2
	if (UnitPropagation(clauses, assignment, nodeInfos, edgeInfos, d) !== 'NOCONFLICT') {
		return 'Unerfuellbar';
	}

	// Zeile else
	var unassigned = unassignedVarExists(assignment);
	// Zeile 4
	while (unassigned !== false) {
		//Zeile 5
		d++;
		// Zeile 6
		var random = Math.random();
		if (random < 0.5){
			assignment[unassigned] = 0;
		} else {
			assignment[unassigned] = 1;
		}
		// Zeile 7
		nodeInfos[unassigned+'='+assignment[unassigned]] = {'Variable': unassigned, 'assignment': assignment[unassigned], 'mark': d};

		// Zeile 8
		var conflictLiteral = UnitPropagation(clauses, assignment, nodeInfos, edgeInfos, d);
		while (conflictLiteral !== 'NOCONFLICT') {
			//Zeile 9-10
			
			/*var firstUIPs = findFirstUIPs(edgeInfos, conflictLiteral);
			var succ = []
			for (var u = 0; u < firstUIPs.length; u++) {			
				var su = successors(edgeInfos, firstUIPs[u]);
				for (var s = 0; s < su.length; s++) {
					if (!succ.includes(su[s])) {
						succ.push(su[s]);
					}
				}
			}
			var pred = []
			for (var s=0; s<= succ.length; s++) {
				var pr = predecessors(edgeInfos,succ[s]);
				for(var p=0; p<pr.length; p++) {
					if(!pred.includes(pr[p]) && !succ.includes(pr[p])) {
						pred.push(pr[p]);
					}
				}
			}*/
			var pred = []
			for (var e = 0; e < edgeInfos.length; e++) {
				if(edgeInfos[e].to == conflictLiteral[0] || edgeInfos[e].to == conflictLiteral[1]) {
					if(!pred.includes(edgeInfos[e].from)){					
						pred.push(edgeInfos[e].from);
					}
				}
			}
			var conflictClause = [];
			for( var p=0; p<pred.length; p++) {
				var assign = nodeInfos[pred[p]].assignment;
				if(assign == 0) {
					conflictClause.push(nodeInfos[pred[p]].Variable);
				} else {
					conflictClause.push('-'+nodeInfos[pred[p]].Variable);
				}
			}
			if(drawOutput) {
				drawGraph(nodeInfos, edgeInfos);
				graphsField.innerHTML = graphsField.innerHTML + "\n\n<p>Gelernte Klausel: " + drawFormula([conflictClause]) + "</p>";
			}

			// Zeile 11
			var max = 0;
			for (var p=0; p<pred.length; p++) {
				if(nodeInfos[pred[p]].mark > max) {
					max = nodeInfos[pred[p]].mark;
				}
			}
			// Zeile 12
			if(max == 0) {
				return 'Unerfuellbar';
			} else { // Zeile 13
				var nodes = Object.keys(nodeInfos);
				// Zeile 14
				for(var n = 0; n < nodes.length; n++) {
					if(nodeInfos[nodes[n]].mark >= max){
						deleteNode(nodeInfos, edgeInfos, assignment, nodes[n]);
					}
				}
				// Zeile 15
				clauses.push(conflictClause);
				d--;
			}
			conflictLiteral = UnitPropagation(clauses, assignment, nodeInfos, edgeInfos, d);
		}
		unassigned = unassignedVarExists(assignment);
	}

	// Zeile 17
	if(drawOutput) {
		assignField.innerText = drawAssignment(assignment);
		drawGraph(nodeInfos, edgeInfos);
	}
	return 'Erfuellbar';
}

function UnitPropagation (clauses, assignment, nodeInfos, edgeInfos, level) {
	var index = unitclauseExists(clauses, assignment);

	// Zeile 1
	while(index !== false) {
		// Zeile 2
		var K = clauses[index[0]][index[1]];
		// Zeile 3
		var a;
		if(K.startsWith('-')) {
			a = 0;
		} else {
			a = 1;
		}

		// Zeile 4
		var k = getVariable(K);
		assignment[k] = a;

		// Zeile 5-8
		nodeInfos[k+'='+a] = {'Variable': k, 'assignment': a, 'mark': level};
		K = clauses[index[0]];
		for (var l=0; l<K.length; l++) {
			if (l==index[1]) { //falls es der neue Knoten ist
				continue;
			} else {
				edgeInfos.push({'from': getVariable(K[l])+"="+assignment[getVariable(K[l])], 'to': k+"="+a});
			}
		}
		var clauseUnfullfilled = formulaUnfulfilled(clauses, assignment);
		if (clauseUnfullfilled !== false) {
			nodeInfos[k+'='+neg(a)] = {'Variable': k, 'assignment': neg(a), 'mark': level};
			for (var l=0; l<clauses[clauseUnfullfilled].length; l++) {
				if (k!==getVariable(clauses[clauseUnfullfilled][l])) {
					edgeInfos.push({'from': getVariable(clauses[clauseUnfullfilled][l])+"="+assignment[getVariable(clauses[clauseUnfullfilled][l])],'to': k+"="+neg(a)});
				}
			}
			return [k+'='+a, k+'='+neg(a)];
		}
		index = unitclauseExists(clauses, assignment);
	}
	return 'NOCONFLICT';
}

function deleteNode(nodeInfos, edgeInfos, assignment, node) {
	//delete assignment
	assignment[nodeInfos[node].Variable] = 2;
	//delete node
	delete nodeInfos[node];
	//delete edges
	for(var e=0; e<edgeInfos.length; e++){
		if(edgeInfos[e].from == node || edgeInfos[e].to == node) {
			edgeInfos.splice(e, 1);

		}
	}
}

function findFirstUIPs(edgeInfos, conflictLiteral) {
	var predecessors1 = depthFirstSearch(edgeInfos, conflictLiteral[0]);
	var predecessors2 = depthFirstSearch(edgeInfos, conflictLiteral[1]);
	var UIPs = intersection(predecessors1, predecessors2)
	var firstUIPs = []
	
	for (var u = 0; u<UIPs.length; u++) {
		var succ = successors(edgeInfos, UIPs[u]);
		var isFirstUIP = false;
		for(var s=0; s< succ.length; s++) {
			if(!UIPs.includes(succ[s])) {
				isFirstUIP = true;
			}
		}
		if(isFirstUIP) {
			firstUIPs.push(UIPs[u])
		}
	}
	return firstUIPs;
}

function intersection (a , b) {
	var result = []
	for (var p = 0; p < a.length; p++) {
		if(b.includes(a[p])) {
			result.push(a[p]);
		}
	}
	return result
}

function successors(edgeInfos, node) {
	var succ = [];
	for(var edge = 0; edge < edgeInfos.length; edge++) {
		if(edgeInfos[edge].from == node) {
			succ.push(edgeInfos[edge].to);
		}
	}
	return succ;
}

function predecessors(edgeInfos, node) {
	var pred = [];
	for(var edge = 0; edge < edgeInfos.length; edge++) {
		if(edgeInfos[edge].to == node) {
			pred.push(edgeInfos[edge].from);
		}
	}
	return pred;
}

function depthFirstSearch(edgeInfos, conflictLiteral) {
	var result = [];
	var stack = [conflictLiteral];
	while(stack.length !== 0) {
		var element = stack[stack.length-1];
		stack.splice(stack.length-1,1);
		result.push(element);
		for(var edge = 0; edge < edgeInfos.length; edge++) {
			if(edgeInfos[edge].to == element) {
				stack.push(edgeInfos[edge].from);
			}
		}
	}
	return result;
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
			} else if ((assignment[getVariable(clauses[c][l])] == 1 && !clauses[c][l].startsWith('-')) || (assignment[getVariable(clauses[c][l])] == 0 && clauses[c][l].startsWith('-'))) {
				fals = false;
			}
		}
		if (fals) {
			return c;
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

function neg(value) {
	if(value == 0) {
		return 1;
	} else {
		return 0;
	}
}

main();

};
