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
	console.log(existingExpressions);
	
	// Now go through all the files in the graphic pack to collect the ones it has to add to each preset.
	for (file in graphicPacks[pack]) {
		console.log(`${("0" + file).slice(-2)}/${("0" + (graphicPacks[pack].length-1)).slice(-2)} || Creating graphic pack "${pack}", at file "${graphicPacks[pack][file]}"...`);
		let textContent = fs.readFileSync(pack+"/"+graphicPacks[pack][file], "utf8").split("\r\n");
		
		for (i=0; i<textContent.length; i++) {
			if (textContent[i].includes("$")) {
				for (preset in existingExpressions) {
					for (variable in existingExpressions[preset]) {
						if (textContent[i].includes("$"+variable)) {
							let roughExpression = textContent[i].split("=");
							if (roughExpression.length === 1) break;
							expression = roughExpression[1].split(";")[0];
							
							if (expression.includes("+")||expression.includes("-")||expression.includes("*")||expression.includes("/")||expression.includes("(")||expression.includes(")")||expression.includes("^")) {
								// Calculate the preset value that we need to add to the preset.
								calc.compile(expression.replace("$","")).calc();
								
								//for ()
								
								break;
							}
						}
					}
					break; // Only check the first preset for any matches.
				}
			}
		}
	}
}