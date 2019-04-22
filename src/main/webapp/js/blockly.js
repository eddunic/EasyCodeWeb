/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* var workspace = Blockly.inject('blocklyDiv',
        {toolbox: document.getElementById('toolbox')});
var defaultBlocks = document.getElementById('blocklyDefault');
Blockly.Xml.domToWorkspace(defaultBlocks, workspace);
function myUpdateFunction(event) {
    var languageDropdown = document.getElementById('languageDropdown');
    var languageSelection = languageDropdown.options[languageDropdown.selectedIndex].value;
    var codeDiv = document.getElementById('codeDiv');
    var codeHolder = document.createElement('pre');
    codeHolder.className = 'prettyprint but-not-that-pretty';
    var code = document.createTextNode(Blockly[languageSelection].workspaceToCode(workspace));
    codeHolder.appendChild(code);
    codeDiv.replaceChild(codeHolder, codeDiv.lastElementChild);
    prettyPrint();
}
workspace.addChangeListener(myUpdateFunction);
function executeBlockCode() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    var initFunc = function (interpreter, scope) {
        var alertWrapper = function (text) {
            text = text ? text.toString() : '';
            return interpreter.createPrimitive(alert(text));
        };
        interpreter.setProperty(scope, 'alert',
                interpreter.createNativeFunction(alertWrapper));
        var promptWrapper = function (text) {
            text = text ? text.toString() : '';
            return interpreter.createPrimitive(prompt(text));
        };
        interpreter.setProperty(scope, 'prompt',
                interpreter.createNativeFunction(promptWrapper));
    };
    var myInterpreter = new Interpreter(code, initFunc);
    var stepsAllowed = 10000;
    while (myInterpreter.step() && stepsAllowed) {
        stepsAllowed--;
    }
    if (!stepsAllowed) {
        throw EvalError('Infinite loop.');
    }
}

document.getElementById('playButton').addEventListener('click', executeBlockCode);
*/