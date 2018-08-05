// A node script to make version 3 graphic packs from the soon also coming version 4

const fs = require("fs");
const path = require("path");
const Calc = require("expression-calculator");


const calc = new Calc();


// Things to check before compiling:
//  - All presets should contain the same variables. There's should be no undefined variables in any preset that's used.


graphicPacks = {};

function processTree(filename) {
    let stats = fs.lstatSync(filename);
	let info = {path: filename, name: path.basename(filename)};
	
	if (stats.isDirectory()) {
		let fileDirectory = fs.readdirSync(filename);
		if (fileDirectory.includes("rules.txt")) {
			graphicPacks[filename] = fileDirectory;
		}
		info.children = fileDirectory.map(child => processTree(filename + '/' + child))
	}
	return info;
}

// Get all the various directories with a rules.txt inside of them.
// This also supports subdirectories too, these will all still be build in the output folder.
processTree("../");

var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

deleteFolderRecursive("../Build");

fs.mkdirSync("../Build");

for (pack in graphicPacks) {
	let instructions = {};
	let existingExpressions = {};
	let compiledGraphicPack = {};
	
	// Check for existing expressions in presets
	let rulesText = fs.readFileSync(pack+"/rules.txt", "utf8").split("\r\n");
	
	let isPresetFlag = false;
	let currExpression = undefined;
	
	for (let i=0; i<rulesText.length; i++) {
		currLine = rulesText[i].trim();
		if (currLine.startsWith("[Preset]")) {
			isPresetFlag = true;
		}
		else if (currLine.startsWith("[") && currLine.split("#")[0].trim().endsWith("]")) {
			isPresetFlag = false;
		}
		else if (isPresetFlag) {
			if (currLine.startsWith("#") || currLine === "") continue;
			if (currLine.startsWith("name")&& currLine.includes("=")) {
				currExpression = existingExpressions[currLine.split("=")[1].trim()] = {};
			}
			else if (currLine.startsWith("$") && currLine.includes("=")) {
				currExpression[currLine.slice(1).split("=")[0].trim()] = currLine.slice(1).split("=")[1].trim();
			}
			currExpression.additionsLine = (currExpression.additionsLine || i)+1;
		}
	}
	// console.log(existingExpressions);
	
	// Now go through all the files in the graphic pack to collect the ones it has to add to each preset.
	for (file in graphicPacks[pack]) {
        console.group(`${("0" + file).slice(-2)}/${("0" + (graphicPacks[pack].length - 1)).slice(-2)} || Creating graphic pack "${pack}", at file "${graphicPacks[pack][file]}"...`);
        let textContent = fs.readFileSync(pack + "/" + graphicPacks[pack][file], "utf8").split("\r\n");
        compiledGraphicPack[graphicPacks[pack][file]] = [];

        for (i = 0; i < textContent.length; i++) {
            if (textContent[i].includes("$")) {
                for (preset in existingExpressions) {
                    for (variable in existingExpressions[preset]) {
                        if (textContent[i].includes("$" + variable)) {
                            let roughExpression = textContent[i].split("=");
                            if (roughExpression.length === 1) break;
                            expression = roughExpression[1].split(";")[0];

                            if (expression.includes("+") || expression.includes("-") || expression.includes("*") || expression.includes("/") || expression.includes("(") || expression.includes(")") || expression.includes("^")) {
                                // Calculate the preset value that we need to add to the preset.
                                for (preset in existingExpressions) {
                                    console.group(`Converting ${expression.trim()} to ${expression.replace(/\$/g, "").trim()} and calculating it with these variables ${JSON.stringify(existingExpressions[preset])}.`);
                                    let result = calc.compile(expression.replace(/\$/g, "")).calc(existingExpressions[preset]);
                                    if (graphicPacks[pack][file] === "rules.txt") result = Math.ceil(result);
                                    console.log(`New preset line for "${preset}" that will be added to line ${existingExpressions[preset].additionsLine} will hold ${result}.`);
                                    let newLine = textContent[i].split("=")[0].trim() + " = $exprFile"+ file + "Line" + i + (graphicPacks[pack][file] === "rules.txt" ? "" : ";");
                                    console.log(`New line at ${i} will be resolved to '${newLine}' and replaces '${textContent[i]}'.`);
                                    console.groupEnd();

                                    existingExpressions[preset].queue = existingExpressions[preset].queue || [];
                                    existingExpressions[preset].queue.push("$exprFile"+ file + "Line" + i +" = "+ result);

                                    if (i === compiledGraphicPack[graphicPacks[pack][file]].length) compiledGraphicPack[graphicPacks[pack][file]].push(newLine);
                                }
                                break;
                            }
                        }
                    }
                    break; // Only check the first preset for any matches.
                }
            }
            if (i === compiledGraphicPack[graphicPacks[pack][file]].length) compiledGraphicPack[graphicPacks[pack][file]].push(textContent[i]);
        }
        console.groupEnd();
    }
    lineOffset = 0;
    for (preset in existingExpressions) {
	    let additionalLines = [];
	    if (existingExpressions[preset].hasOwnProperty("queue")) {
            additionalLines[existingExpressions[preset].additionsLine] = [];
	        for (queueItem in existingExpressions[preset].queue) {
	            additionalLines[existingExpressions[preset].additionsLine].push(existingExpressions[preset].queue[queueItem]);
            }
        }
        for (newLine in additionalLines) {
	        compiledGraphicPack["rules.txt"].splice(parseInt(newLine)+lineOffset, 0, additionalLines[newLine].join("\r\n"));
	        lineOffset++;
        }
        let newRulesFile = [];
    }

    fs.mkdirSync("../Build/"+pack.split("/")[pack.split("/").length-1]);
    for (file in compiledGraphicPack) {
        fs.writeFileSync("../Build/"+pack.split("/")[pack.split("/").length-1]+"/"+file, compiledGraphicPack[file].join("\r\n"));
    }
    //console.log("", compiledGraphicPack["rules.txt"]);
}