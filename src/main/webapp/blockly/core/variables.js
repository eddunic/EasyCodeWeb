/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utility functions for handling variables.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * @name Blockly.Variables
 * @namespace
 */
goog.provide('Blockly.Variables');

goog.require('Blockly.Blocks');
goog.require('Blockly.constants');
goog.require('Blockly.VariableModel');
goog.require('Blockly.Workspace');
goog.require('Blockly.Xml');

goog.require('goog.string');


/**
 * Constant to separate variable names from procedures and generated functions
 * when running generators.
 * @deprecated Use Blockly.VARIABLE_CATEGORY_NAME
 */
Blockly.Variables.NAME_TYPE = Blockly.VARIABLE_CATEGORY_NAME;

/**
 * Find all user-created variables that are in use in the workspace.
 * For use by generators.
 * To get a list of all variables on a workspace, including unused variables,
 * call Workspace.getAllVariables.
 * @param {!Blockly.Workspace} ws The workspace to search for variables.
 * @return {!Array.<!Blockly.VariableModel>} Array of variable models.
 */
Blockly.Variables.allUsedVarModels = function(ws) {
  var blocks = ws.getAllBlocks(false);
  var variableHash = Object.create(null);
  // Iterate through every block and add each variable to the hash.
  for (var i = 0; i < blocks.length; i++) {
    var blockVariables = blocks[i].getVarModels();
    if (blockVariables) {
      for (var j = 0; j < blockVariables.length; j++) {
        var variable = blockVariables[j];
        var id = variable.getId();
        if (id) {
          variableHash[id] = variable;
        }
      }
    }
  }
  // Flatten the hash into a list.
  var variableList = [];
  for (var id in variableHash) {
    variableList.push(variableHash[id]);
  }
  return variableList;
};

/**
 * Find all user-created variables that are in use in the workspace and return
 * only their names.
 * For use by generators.
 * To get a list of all variables on a workspace, including unused variables,
 * call Workspace.getAllVariables.
 * @deprecated January 2018
 */
Blockly.Variables.allUsedVariables = function() {
  console.warn('Deprecated call to Blockly.Variables.allUsedVariables. ' +
      'Use Blockly.Variables.allUsedVarModels instead.\nIf this is a major ' +
      'issue please file a bug on GitHub.');
};

/**
 * @private
 * @type {Object<string,boolean>}
 */
Blockly.Variables.ALL_DEVELOPER_VARS_WARNINGS_BY_BLOCK_TYPE_ = {};

/**
 * Find all developer variables used by blocks in the workspace.
 * Developer variables are never shown to the user, but are declared as global
 * variables in the generated code.
 * To declare developer variables, define the getDeveloperVariables function on
 * your block and return a list of variable names.
 * For use by generators.
 * @param {!Blockly.Workspace} workspace The workspace to search.
 * @return {!Array.<string>} A list of non-duplicated variable names.
 */
Blockly.Variables.allDeveloperVariables = function(workspace) {
  var blocks = workspace.getAllBlocks(false);
  var variableHash = Object.create(null);
  for (var i = 0, block; block = blocks[i]; i++) {
    var getDeveloperVariables = block.getDeveloperVariables;
    if (!getDeveloperVariables && block.getDeveloperVars) {
      // August 2018: getDeveloperVars() was deprecated and renamed
      // getDeveloperVariables().
      getDeveloperVariables = block.getDeveloperVars;
      if (!Blockly.Variables.ALL_DEVELOPER_VARS_WARNINGS_BY_BLOCK_TYPE_[
          block.type]) {
        console.warn('Function getDeveloperVars() deprecated. Use ' +
            'getDeveloperVariables() (block type \'' + block.type + '\')');
        Blockly.Variables.ALL_DEVELOPER_VARS_WARNINGS_BY_BLOCK_TYPE_[
            block.type] = true;
      }
    }
    if (getDeveloperVariables) {
      var devVars = getDeveloperVariables();
      for (var j = 0; j < devVars.length; j++) {
        variableHash[devVars[j]] = true;
      }
    }
  }

  // Flatten the hash into a list.
  return Object.keys(variableHash);
};

/**
 * Construct the elements (blocks and button) required by the flyout for the
 * variable category.
 * @param {!Blockly.Workspace} workspace The workspace containing variables.
 * @return {!Array.<!Element>} Array of XML elements.
 */
Blockly.Variables.flyoutCategory = function(workspace) {
  var xmlList = [];
  var button = document.createElement('button');
  button.setAttribute('text', '%{BKY_NEW_VARIABLE}');
  button.setAttribute('callbackKey', 'CREATE_VARIABLE');

  workspace.registerButtonCallback('CREATE_VARIABLE', function(button) {
    Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
  });

  xmlList.push(button);

  var blockList = Blockly.Variables.flyoutCategoryBlocks(workspace);
  xmlList = xmlList.concat(blockList);
  return xmlList;
};

/**
 * Construct the blocks required by the flyout for the variable category.
 * @param {!Blockly.Workspace} workspace The workspace containing variables.
 * @return {!Array.<!Element>} Array of XML block elements.
 */
Blockly.Variables.flyoutCategoryBlocks = function(workspace) {
  var variableModelList = workspace.getVariablesOfType('');

  var xmlList = [];
  if (variableModelList.length > 0) {
    // New variables are added to the end of the variableModelList.
    var mostRecentVariableFieldXmlString =
      Blockly.Variables.generateVariableFieldXmlString(
          variableModelList[variableModelList.length - 1]);
    if (Blockly.Blocks['variables_set']) {
      var gap = Blockly.Blocks['math_change'] ? 8 : 24;
      var blockText = '<xml>' +
          '<block type="variables_set" gap="' + gap + '">' +
          mostRecentVariableFieldXmlString +
          '</block>' +
          '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }
    if (Blockly.Blocks['math_change']) {
      var gap = Blockly.Blocks['variables_get'] ? 20 : 8;
      var blockText = '<xml>' +
          '<block type="math_change" gap="' + gap + '">' +
          mostRecentVariableFieldXmlString +
          '<value name="DELTA">' +
          '<shadow type="math_number">' +
          '<field name="NUM">1</field>' +
          '</shadow>' +
          '</value>' +
          '</block>' +
          '</xml>';
      var block = Blockly.Xml.textToDom(blockText).firstChild;
      xmlList.push(block);
    }

    if (Blockly.Blocks['variables_get']) {
      variableModelList.sort(Blockly.VariableModel.compareByName);
      for (var i = 0, variable; variable = variableModelList[i]; i++) {
        var blockText = '<xml>' +
            '<block type="variables_get" gap="8">' +
            Blockly.Variables.generateVariableFieldXmlString(variable) +
            '</block>' +
            '</xml>';
        var block = Blockly.Xml.textToDom(blockText).firstChild;
        xmlList.push(block);
      }
    }
  }
  return xmlList;
};

/**
 * Return a new variable name that is not yet being used. This will try to
 * generate single letter variable names in the range 'i' to 'z' to start with.
 * If no unique name is located it will try 'i' to 'z', 'a' to 'h',
 * then 'i2' to 'z2' etc.  Skip 'l'.
 * @param {!Blockly.Workspace} workspace The workspace to be unique in.
 * @return {string} New variable name.
 */
Blockly.Variables.generateUniqueName = function(workspace) {
  var variableList = workspace.getAllVariables();
  var newName = '';
  if (variableList.length) {
    var nameSuffix = 1;
    var letters = 'ijkmnopqrstuvwxyzabcdefgh';  // No 'l'.
    var letterIndex = 0;
    var potName = letters.charAt(letterIndex);
    while (!newName) {
      var inUse = false;
      for (var i = 0; i < variableList.length; i++) {
        if (variableList[i].name.toLowerCase() == potName) {
          // This potential name is already used.
          inUse = true;
          break;
        }
      }
      if (inUse) {
        // Try the next potential name.
        letterIndex++;
        if (letterIndex == letters.length) {
          // Reached the end of the character sequence so back to 'i'.
          // a new suffix.
          letterIndex = 0;
          nameSuffix++;
        }
        potName = letters.charAt(letterIndex);
        if (nameSuffix > 1) {
          potName += nameSuffix;
        }
      } else {
        // We can use the current potential name.
        newName = potName;
      }
    }
  } else {
    newName = 'i';
  }
  return newName;
};

/**
 * Handles "Create Variable" button in the default variables toolbox category.
 * It will prompt the user for a varibale name, including re-prompts if a name
 * is already in use among the workspace's variables.
 *
 * Custom button handlers can delegate to this function, allowing variables
 * types and after-creation processing. More complex customization (e.g.,
 * prompting for variable type) is beyond the scope of this function.
 *
 * @param {!Blockly.Workspace} workspace The workspace on which to create the
 *     variable.
 * @param {function(?string=)=} opt_callback A callback. It will be passed an
 *     acceptable new variable name, or null if change is to be aborted (cancel
 *     button), or undefined if an existing variable was chosen.
 * @param {string=} opt_type The type of the variable like 'int', 'string', or
 *     ''. This will default to '', which is a specific type.
 */
Blockly.Variables.createVariableButtonHandler = function(
    workspace, opt_callback, opt_type) {
  var type = opt_type || '';
  // This function needs to be named so it can be called recursively.
  var promptAndCheckWithAlert = function(defaultName) {
    Blockly.Variables.promptName(Blockly.Msg['NEW_VARIABLE_TITLE'], defaultName,
        function(text) {
          if (text) {
            var existing =
                Blockly.Variables.nameUsedWithAnyType_(text, workspace);
            if (existing) {
              var lowerCase = text.toLowerCase();
              if (existing.type == type) {
                var msg = Blockly.Msg['VARIABLE_ALREADY_EXISTS'].replace(
                    '%1', lowerCase);
              } else {
                var msg =
                    Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'];
                msg = msg.replace('%1', lowerCase).replace('%2', existing.type);
              }
              Blockly.alert(msg,
                  function() {
                    promptAndCheckWithAlert(text);  // Recurse
                  });
            } else {
              // No conflict
              workspace.createVariable(text, type);
              if (opt_callback) {
                opt_callback(text);
              }
            }
          } else {
            // User canceled prompt.
            if (opt_callback) {
              opt_callback(null);
            }
          }
        });
  };
  promptAndCheckWithAlert('');
};
goog.exportSymbol('Blockly.Variables.createVariableButtonHandler',
    Blockly.Variables.createVariableButtonHandler);

/**
 * Original name of Blockly.Variables.createVariableButtonHandler(..).
 * @deprecated Use Blockly.Variables.createVariableButtonHandler(..).
 *
 * @param {!Blockly.Workspace} workspace The workspace on which to create the
 *     variable.
 * @param {function(?string=)=} opt_callback A callback. It will be passed an
 *     acceptable new variable name, or null if change is to be aborted (cancel
 *     button), or undefined if an existing variable was chosen.
 * @param {string=} opt_type The type of the variable like 'int', 'string', or
 *     ''. This will default to '', which is a specific type.
 */
Blockly.Variables.createVariable =
    Blockly.Variables.createVariableButtonHandler;
goog.exportSymbol('Blockly.Variables.createVariable',
    Blockly.Variables.createVariable);

/**
 * Rename a variable with the given workspace, variableType, and oldName.
 * @param {!Blockly.Workspace} workspace The workspace on which to rename the
 *     variable.
 * @param {Blockly.VariableModel} variable Variable to rename.
 * @param {function(?string=)=} opt_callback A callback. It will
 *     be passed an acceptable new variable name, or null if change is to be
 *     aborted (cancel button), or undefined if an existing variable was chosen.
 */
Blockly.Variables.renameVariable = function(workspace, variable,
    opt_callback) {
  // This function needs to be named so it can be called recursively.
  var promptAndCheckWithAlert = function(defaultName) {
    var promptText =
        Blockly.Msg['RENAME_VARIABLE_TITLE'].replace('%1', variable.name);
    Blockly.Variables.promptName(promptText, defaultName,
        function(newName) {
          if (newName) {
            var existing = Blockly.Variables.nameUsedWithOtherType_(newName,
                variable.type, workspace);
            if (existing) {
              var msg = Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE']
                  .replace('%1', newName.toLowerCase())
                  .replace('%2', existing.type);
              Blockly.alert(msg,
                  function() {
                    promptAndCheckWithAlert(newName);  // Recurse
                  });
            } else {
              workspace.renameVariableById(variable.getId(), newName);
              if (opt_callback) {
                opt_callback(newName);
              }
            }
          } else {
            // User canceled prompt.
            if (opt_callback) {
              opt_callback(null);
            }
          }
        });
  };
  promptAndCheckWithAlert('');
};

/**
 * Prompt the user for a new variable name.
 * @param {string} promptText The string of the prompt.
 * @param {string} defaultText The default value to show in the prompt's field.
 * @param {function(?string)} callback A callback. It will return the new
 *     variable name, or null if the user picked something illegal.
 */
Blockly.Variables.promptName = function(promptText, defaultText, callback) {
  Blockly.prompt(promptText, defaultText, function(newVar) {
    // Merge runs of whitespace.  Strip leading and trailing whitespace.
    // Beyond this, all names are legal.
    if (newVar) {
      newVar = newVar.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
      if (newVar == Blockly.Msg['RENAME_VARIABLE'] ||
          newVar == Blockly.Msg['NEW_VARIABLE']) {
        // Ok, not ALL names are legal...
        newVar = null;
      }
    }
    callback(newVar);
  });
};

/**
 * Check whether there exists a variable with the given name but a different
 * type.
 * @param {string} name The name to search for.
 * @param {string} type The type to exclude from the search.
 * @param {!Blockly.Workspace} workspace The workspace to search for the
 *     variable.
 * @return {Blockly.VariableModel} The variable with the given name and a
 *     different type, or null if none was found.
 * @private
 */
Blockly.Variables.nameUsedWithOtherType_ = function(name, type, workspace) {
  var allVariables = workspace.getVariableMap().getAllVariables();

  name = name.toLowerCase();
  for (var i = 0, variable; variable = allVariables[i]; i++) {
    if (variable.name.toLowerCase() == name && variable.type != type) {
      return variable;
    }
  }
  return null;
};

/**
 * Check whether there exists a variable with the given name of any type.
 * @param {string} name The name to search for.
 * @param {!Blockly.Workspace} workspace The workspace to search for the
 *     variable.
 * @return {Blockly.VariableModel} The variable with the given name,
 *     or null if none was found.
 * @private
 */
Blockly.Variables.nameUsedWithAnyType_ = function(name, workspace) {
  var allVariables = workspace.getVariableMap().getAllVariables();

  name = name.toLowerCase();
  for (var i = 0, variable; variable = allVariables[i]; i++) {
    if (variable.name.toLowerCase() == name) {
      return variable;
    }
  }
  return null;
};

/**
 * Generate XML string for variable field.
 * @param {!Blockly.VariableModel} variableModel The variable model to generate
 *     an XML string from.
 * @return {string} The generated XML.
 * @package
 */
Blockly.Variables.generateVariableFieldXmlString = function(variableModel) {
  // The variable name may be user input, so it may contain characters that
  // need to be escaped to create valid XML.
  var typeString = variableModel.type;
  if (typeString == '') {
    typeString = '\'\'';
  }
  var text = '<field name="VAR" id="' + variableModel.getId() +
      '" variabletype="' + goog.string.htmlEscape(typeString) +
      '">' + goog.string.htmlEscape(variableModel.name) + '</field>';
  return text;
};

/**
 * Generate DOM objects representing a variable field.
 * @param {!Blockly.VariableModel} variableModel The variable model to
 *     represent.
 * @return {Element} The generated DOM.
 * @public
 */
Blockly.Variables.generateVariableFieldDom = function(variableModel) {
  var xmlFieldString =
      Blockly.Variables.generateVariableFieldXmlString(variableModel);
  var text = '<xml>' + xmlFieldString + '</xml>';
  var dom = Blockly.Xml.textToDom(text);
  var fieldDom = dom.firstChild;
  return fieldDom;
};

/**
 * Helper function to look up or create a variable on the given workspace.
 * If no variable exists, creates and returns it.
 * @param {!Blockly.Workspace} workspace The workspace to search for the
 *     variable.  It may be a flyout workspace or main workspace.
 * @param {string} id The ID to use to look up or create the variable, or null.
 * @param {string=} opt_name The string to use to look up or create the
 *     variable.
 * @param {string=} opt_type The type to use to look up or create the variable.
 * @return {!Blockly.VariableModel} The variable corresponding to the given ID
 *     or name + type combination.
 */
Blockly.Variables.getOrCreateVariablePackage = function(workspace, id, opt_name,
    opt_type) {
  var variable = Blockly.Variables.getVariable(workspace, id, opt_name,
      opt_type);
  if (!variable) {
    variable = Blockly.Variables.createVariable_(workspace, id, opt_name,
        opt_type);
  }
  return variable;
};

/**
 * Look up  a variable on the given workspace.
 * Always looks in the main workspace before looking in the flyout workspace.
 * Always prefers lookup by ID to lookup by name + type.
 * @param {!Blockly.Workspace} workspace The workspace to search for the
 *     variable.  It may be a flyout workspace or main workspace.
 * @param {string} id The ID to use to look up the variable, or null.
 * @param {string=} opt_name The string to use to look up the variable.
 *     Only used if lookup by ID fails.
 * @param {string=} opt_type The type to use to look up the variable.
 *     Only used if lookup by ID fails.
 * @return {Blockly.VariableModel} The variable corresponding to the given ID
 *     or name + type combination, or null if not found.
 * @package
 */
Blockly.Variables.getVariable = function(workspace, id, opt_name, opt_type) {
  var potentialVariableMap = workspace.getPotentialVariableMap();
  // Try to just get the variable, by ID if possible.
  if (id) {
    // Look in the real variable map before checking the potential variable map.
    var variable = workspace.getVariableById(id);
    if (!variable && potentialVariableMap) {
      variable = potentialVariableMap.getVariableById(id);
    }
    if (variable) {
      return variable;
    }
  }
  // If there was no ID, or there was an ID but it didn't match any variables,
  // look up by name and type.
  if (opt_name) {
    if (opt_type == undefined) {
      throw Error('Tried to look up a variable by name without a type');
    }
    // Otherwise look up by name and type.
    var variable = workspace.getVariable(opt_name, opt_type);
    if (!variable && potentialVariableMap) {
      variable = potentialVariableMap.getVariable(opt_name, opt_type);
    }
  }
  return variable;
};

/**
 * Helper function to create a variable on the given workspace.
 * @param {!Blockly.Workspace} workspace The workspace in which to create the
 * variable.  It may be a flyout workspace or main workspace.
 * @param {string} id The ID to use to create the variable, or null.
 * @param {string=} opt_name The string to use to create the variable.
 * @param {string=} opt_type The type to use to create the variable.
 * @return {!Blockly.VariableModel} The variable corresponding to the given ID
 *     or name + type combination.
 * @private
 */
Blockly.Variables.createVariable_ = function(workspace, id, opt_name,
    opt_type) {
  var potentialVariableMap = workspace.getPotentialVariableMap();
  // Variables without names get uniquely named for this workspace.
  if (!opt_name) {
    var ws = workspace.isFlyout ? workspace.targetWorkspace : workspace;
    opt_name = Blockly.Variables.generateUniqueName(ws);
  }

  // Create a potential variable if in the flyout.
  if (potentialVariableMap) {
    var variable = potentialVariableMap.createVariable(opt_name, opt_type, id);
  } else {  // In the main workspace, create a real variable.
    var variable = workspace.createVariable(opt_name, opt_type, id);
  }
  return variable;
};

/**
 * Helper function to get the list of variables that have been added to the
 * workspace after adding a new block, using the given list of variables that
 * were in the workspace before the new block was added.
 * @param {!Blockly.Workspace} workspace The workspace to inspect.
 * @param {!Array.<!Blockly.VariableModel>} originalVariables The array of
 *     variables that existed in the workspace before adding the new block.
 * @return {!Array.<!Blockly.VariableModel>} The new array of variables that
 *     were freshly added to the workspace after creating the new block,
 *     or [] if no new variables were added to the workspace.
 * @package
 */
Blockly.Variables.getAddedVariables = function(workspace, originalVariables) {
  var allCurrentVariables = workspace.getAllVariables();
  var addedVariables = [];
  if (originalVariables.length != allCurrentVariables.length) {
    for (var i = 0; i < allCurrentVariables.length; i++) {
      var variable = allCurrentVariables[i];
      // For any variable that is present in allCurrentVariables but not
      // present in originalVariables, add the variable to addedVariables.
      if (originalVariables.indexOf(variable) == -1) {
        addedVariables.push(variable);
      }
    }
  }
  return addedVariables;
};

/**
 * Find a context for a variable.  If it is inside a procedure, we want to have
 * The name of the containing procedure.  If this is a global variable then
 * we want to return a null
 * @param {!Blockly.Block} block Block to get context for
 * @param {string} name string of the name to look for.
 * @return {string} Context of the procedure (string) or null)
*/
Blockly.Variables.getLocalContext = function(block,name) {
  do {
    if (block.getProcedureDef) {
      var tuple = block.getProcedureDef.call(block);
      var params = tuple[1];
      if (name === null) {
        return tuple[0]+'.';
      }
      for(var i = 0; i < params.length; i++) {
        if (params[i]['name'] === name) {
          return tuple[0]+'.';
        }
      }
      break;
    } else if (block.type === 'initialize_variable' &&
        block.getFieldValue('VAR') === name ) {
      // We found an initialize_variable block, so now we want to go through
      // and continue until we find the containing procedure (if any)
      name = null;
    }
    block = block.getParent();
  } while (block);
  return null;
};

/**
 * Find all user-created variables.
 * @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
 * @return {!Array.<string>} Array of variable names.
 */
Blockly.Variables.allVariables = function(root) {
  var blocks;
  if (root.getDescendants) {
    // Root is Block.
    blocks = root.getDescendants();
  } else if (root.getAllBlocks) {
    // Root is Workspace.
    blocks = root.getAllBlocks();
  } else {
    throw 'Not Block or Workspace: ' + root;
  }
  var variableHash = Object.create(null);
  // Iterate through every block and add each variable to the hash.
  for (var x = 0; x < blocks.length; x++) {
    if (blocks[x].getVars) {
      var blockVariables = blocks[x].getVars();
      for (var y = 0; y < blockVariables.length; y++) {
        var varName = blockVariables[y];
        // Variable name may be null if the block is only half-built.
        if (varName) {
          variableHash[varName.toLowerCase()] = varName;
        }
      }
    }
  }
  // Flatten the hash into a list.
  var variableList = [];
  for (var name in variableHash) {
    variableList.push(variableHash[name]);
  }
  return variableList;
};

/**
 * Find all user-created variables with their types.
 * @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
 * @return {!} Hash of variable names and their types.
 */
Blockly.Variables.allVariablesTypes = function(root) {
  var blocks;
  if (root.getDescendants) {
    // Root is Block.
    blocks = root.getDescendants();
  } else if (root.getAllBlocks) {
    // Root is Workspace.
    blocks = root.getAllBlocks();
  } else {
    throw 'Not Block or Workspace: ' + root;
  }
  var variableHash = Object.create(null);
  var variableTypes = Object.create(null);
  // Iterate through every block and add each variable to the hash.
  for (var x = 0; x < blocks.length; x++) {
    var func = blocks[x].getVarsTypes;
    if (func) {
      var blockVariablesTypes = func.call(blocks[x]);
      for (var key in blockVariablesTypes) {
        if (blockVariablesTypes.hasOwnProperty(key)) {
          if (typeof variableHash[key] === 'undefined') {
            variableHash[key] = blockVariablesTypes[key];
          } else {
            var intersect = Blockly.Variables.Intersection(
                      variableHash[key], blockVariablesTypes[key]);
            if (goog.array.isEmpty(intersect)) {
              intersect = ['Var'];
            }
            console.log('Block:'+ blocks[x].type + '.'+blocks[x].id+
            ' For: '+key+' was:'+variableHash[key]+' got:'+
            blockVariablesTypes[key]+' result='+intersect);
            variableHash[key] = intersect;
          }
        }
      }
    }
  }
  //
  // We now have all of the variables.  Next we want to go through and flatten
  // the types into what we know and what we don't know.  There will be several
  // options here.
  //   1) We have a single type for the variable.  This is the easy case.  We
  //      take that type.
  //   2) We have no type information.  For these we will assume that the
  //      type will be a scalar.
  //   3) We have more than one type, but the types are all mutable (i.e. int
  //      vs float or JSON vs Array).  For that we use the superior type
  //   4) We have a conflict between types.  For this we will take the superior
  //      type and then tell all of the functions that there is a conflict on
  //      that variable which needs to be resolved.
  var variableList = Object.create(null);;
  for (var key in variableHash) {
    variableList[key] = this.resolveTypes(variableHash[key]);
  }
  return variableList;
};

/**
 * Compute the intersection between two arrays of types
 * @param {Array<string>} arr1
 * @param {Array<string>} arr2
 * @return {Array<string>}
 *  Any exact matches on both sides are kept.
 *  Any matches which have a more specific qualifier are replaced by the
 *    more specific qualifier.  e.g. Array: and Array:Foo result in Array:Foo
 *  Any matches against an entry in the VariableTypeEquivalence array are 
 *    replaced by the VariableTypeEquivalence entry.
 */
Blockly.Variables.Intersection = function(arr1, arr2) {
  /**
   * This private function builds up a proper map from the input array
   */
  var buildMap = function(arr) {
    var map = {};
    var collections = {};
    // We want to add all of the elements from the array as hash keys
    for (var i = 0; i < arr.length; i++) {
      // If this element has a defined equivalence, we want to use it
      var toadd = Blockly.VariableTypeEquivalence[arr[i]];
      if (!toadd) {
        // If no equivalence, we just have an array of the element to add
        toadd = [arr[i]];
      }
      // Since we may end up with more than one from the equivalence we need
      // to iterate over them all.
      for (var e = 0; e < toadd.length; e++) {
        // See if this has any subtypes (Array:String, Map:String, ...)
        var subtype = toadd[e].split(':');
        // TODO: Do we need to handle equivalence of subtypes?
        var submap = map;
        // We should have at least one, but put them into place.
        while(subtype.length > 0) {
          var elem = subtype.shift();
          // If the current type already exists in the map, we don't need to
          // do anything.  If there is a sub type, it will be put in place.
          // If not, we already have it done.  For example if the first type
          // was Array:String and the second type was just Array we would hit
          // this case and not have to record the less restrictive type.
          if (typeof submap[elem] === 'object') {
            submap = submap[elem];
          } else if (subtype.length) {
            // The current type wasn't an object or doesn't exist, but we have
            // at least one more level (i.e. the first time we encounter a type
            // of Array:String).  Just create a hash at that level and navigate
            // into it for the remainder of the types
            submap[elem] = {};
            submap = submap[elem];
          } else {
            // We are at the bottom level and there was nothing already here
            // so just mark this entry as being a plain value.
            submap[elem] = 1;
          }
        }
      }
    }
    return map;
  };

  /**
   * This private function filters two maps in order to find the intersection of
   * types in the two maps taking into account types which are of a higher
   * equivalence value
   */
  var filterMap = function(m1, m2) {
    var res = {};
    var found = false;
    for (var key in m1) {
      if (m1.hasOwnProperty(key) && m2.hasOwnProperty(key)) {
        if (m1[key] === 1) {
          // The first map is a singleton so we take whatever is in the second
          // map (which may also be a singleton, but we don't care.
          // Hence if we have Array  on M1 and Array:{String,Number} we will
          // get Array:{String,Number}
          res[key] = m2[key];
          found = true;
        } else if (m2[key] === 1) {
          // The first map is not a singleton but the second map is, so we take
          // the first map value
          res[key] = m1[key];
          found = true;
        } else {
          // Both maps are hashes.  We need to take the interdection of the
          // two values.
          var intersect = filterMap(m1[key], m2[key]);
          if (!intersect) {
            intersect = { 'Var': 1};
          }
          res[key] = intersect;
          found = true;
        }
      }
    }
    if (!found) {
      res = null;
    }
    return res;
  }

  /**
   * This private function takes the map result and converts it back into an
   * array of strings
   */
  var consolidateMap = function(map) {
    var result = [];
    if (map) {
      for (var key in map) {
        if (map.hasOwnProperty(key)) {
          if (map[key] === 1) {
            result.push(key);
          } else {
            var submap = consolidateMap(map[key]);
            for(var i = 0; i < submap.length; i++) {
              result.push(key+':'+submap[i]);
            }
          }
        }
      }
    }
    return result;
  }

  // We are going to mangle the arrays so make a deep copy
  var m1 = buildMap(arr1);
  var m2 = buildMap(arr2);

  // Filter the map and then convert it back to the array that we need.
  return consolidateMap(filterMap(m1,m2));
};
