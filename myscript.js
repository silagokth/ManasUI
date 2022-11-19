/*
This is version 0.0.4
*/
$(document).ready(function () {

    //Store the json content as an object
    var isaData = {};
    //Map the value of "select" to instruction name
    const instructionMap = {};//{1: 'HALT', 2: 'REFI', 3: 'DPU', 4: 'SWB', 5: 'JUMP', 6: 'WAIT', 7: 'LOOP', 8: 'RACCU', 9: 'BRANCH', 10: 'ROUTE', 11: 'SRAM'}
    //Hold the current selected instruction
    let currentSelectedInstr = "";
    //save the current selected instruction id
    let textareaWl = 0;
    //instruction id counter
    let instrID = 1;
    //a list to store all program lines
    var programManager = {};

    //CODE section
    const FABRIC_ROW = 5;
    const FABRIC_COLUMN = 6;
    var cellArray;
    let cellString = ""; //"r,c"

    //RELATION section
    //const relationObj = {};
    const phaseObj = {};//{'HALT' : num, 'REFI': num, 'DPU' : num, ...}

    //programLine class
    class programLine {
        constructor() {
            this.segmentOptionObject = {};
            this.isValid = false;
            this.resConstraints = null;
        }

        createLineFromUserInput(userInputArg) {
            if (!this.lineNum) {
                this.lineNum = instrID++;
            }
            if (!this.id) {
                this.id = getLineNumberString(this.lineNum);
            }
            this.userInput = userInputArg;
            this.name = this.userInput.substring(0, this.userInput.indexOf(" "));
            this.phase = phaseObj[this.name];
            this.immediate = 0;
            this.segmentOptStr = this.userInput.substring(this.userInput.indexOf(" ") + 1, this.userInput.length);
            var segmentOptionArray = this.segmentOptStr.split(', ');
            for (let count = 0; count < segmentOptionArray.length; count += 1) {
                var segmentPair = segmentOptionArray[count].split('=');
                this.segmentOptionObject[String(segmentPair[0])] = segmentPair[1];
            }
            this.segmentValuesStr = null;
            this.timelabels = [[4, ""], [3, ""], [2, ""], [1, ""], [0, ""]];
            this.timestamps = [[4, -1], [3, -1], [2, -1], [1, -1], [0, -1]];
            //generate full line
            this.generateFullInstructionLine();
            this.generateFullOptionsObject();
            this.yieldConstraints();
        }

        setCellPosition(rowArg, colArg) {
            this.row = rowArg;
            this.column = colArg;
        }

        setValid(val) {
            this.isvalid = val;
        }

        setId(newId) {
            this.id = newId;
        }

        setImmediate(val) {
            this.immediate = val;
        }

        setSegmentValuesStr(str) {
            this.segmentValuesStr = str;
        }

        setTimelabels(labels) {
            this.timelabels = labels;
        }

        setTimestamps(stamps) {
            this.timestamps = stamps;
        }

        getIsValid() {
            return this.isValid;
        }

        getName() {
            return this.name;
        }

        getId() {
            return this.id;
        }

        getLineNum() {
            return this.lineNum;
        }

        getUserInput() {
            return this.userInput;//contain id
        }

        getSegmentOptionStr() {
            return this.segmentOptStr; //only segment values
        }

        getCellPosition() {
            return [this.row, this.column];
        }

        getFullLine() {
            return this.fullLine;
        }

        getFullOptionsObject() {
            return this.fullOptionsObject;
        }

        getImmediate(val) {
            return this.immediate;
        }

        getSegmentValuesStr() {
            return this.segmentValuesStr;
        }

        getTimelabels() {
            return this.timelabels;
        }

        getTimestamps() {
            return this.timestamps;
        }

        getNodeArray() {
            let nodeArr = [];
            for (let count = 1; count < Number(this.phase) + 1; count++) {
                nodeArr.push("Op_" + this.getId() + "_" + count);
            }
            return nodeArr;
        }

        generateFullInstructionLine() {
            var insTemplates = isaData.instruction_templates;

            for (let i in insTemplates) {
                if (insTemplates[i].name == this.name) {
                    var segmentList = insTemplates[i].segment_templates;
                    this.fullLine = insTemplates[i].name;

                    for (let j in segmentList) {
                        var segValue = this.segmentOptionObject[segmentList[j].name];
                        if (typeof segValue != "undefined") {
                            this.fullLine += " " + segValue;
                        } else if (typeof segmentList[j].default_val != "undefined") {
                            this.fullLine += " " + segmentList[j].default_val;
                        } else {
                            this.fullLine += " " + 0;
                        }
                    }
                    break;
                }
            }
        }

        generateFullOptionsObject() {
            var insTemplates = isaData.instruction_templates;

            for (let i in insTemplates) {
                if (insTemplates[i].name == this.name) {
                    var segmentList = insTemplates[i].segment_templates;
                    this.fullOptionsObject = {};

                    for (let j in segmentList) {
                        var segValue = this.segmentOptionObject[segmentList[j].name];
                        if (typeof segValue != "undefined") {
                            this.fullOptionsObject[segmentList[j].name] = Number(segValue);
                        } else if (typeof segmentList[j].default_val != "undefined") {
                            this.fullOptionsObject[segmentList[j].name] = segmentList[j].default_val;
                        } else {
                            this.fullOptionsObject[segmentList[j].name] = 0;
                        }
                    }
                    break;
                }
            }
        }

        yieldConstraints() {
            var args = {};
            switch (this.name) {
                case 'WAIT':
                    args = { cycle: Number(this.segmentOptionObject.cycle) };
                    break;
                case 'REFI':
                    args = { l1_iter: Number(this.segmentOptionObject.l1_iter) };
                    break;
                case 'SRAM':
                    args = { hops: Number(this.segmentOptionObject.hops), l1_iter: Number(this.segmentOptionObject.l1_iter) };
                    break;
            }
            this.resConstraints = $cellUnit.timingConstraints('getConstraints', this.name, args);
        }

        getConstraints() {
            return this.resConstraints;
        }
    }

    var $cellUnit = $('#cellUnitContainer');
    $('#inputFiles').change(handleFileSelect);
    $cellUnit.click(handleClickOnCellUnitContainer);
    $cellUnit.timingConstraints({});//init plugin

    /**
     * Program module
     * 
     */
    function initCell() {
        cellArray = new Array(FABRIC_ROW);
        for (i = 0; i < FABRIC_ROW; i++) {
            cellArray[i] = new Array(FABRIC_COLUMN);
        }
    }

    /**
     * Diagram module
     * 
     */
    function initRelation() {
        relationManager = {};
        createOpGroup("ROOT", "0", "ROOT", "0");
    }

    /* Load the selected file -> expected "isa.json" */
    /**
     * I/O module
     * Load the files selected by user
     * @param {any} evt
     */
    function handleFileSelect(evt) {
        var file = evt.target.files[0]; // FileList object
        var reader = new FileReader();

        reader.onload = (function (theFile) {
            return function (e) {
                fetch(e.target.result)
                    .then(res => res.json()) // the .json() method parses the JSON response into a JS object literal
                    .then(data => parseInputfile(theFile.name, data));
            }
        })(file);

        reader.readAsDataURL(file);
    }

    /**
     * I/O module
     * 
     * @param {any} filename
     * @param {any} data
     */
    function parseInputfile(filename, data) {
        if (filename.startsWith("isa")) {
            isaData = data;
            refreshHomepage(true);
        } else if (filename.startsWith("descriptor")) {
            restoreProgramFromJSON(data);
        }
    }

    /**
    * I/O module
    * 
    * @param {any} manasObj
    */
    function restoreProgramFromJSON(manasObj) {
        var hasGraph = false;

        if (!('isa' in manasObj)) {
            return;
        }

        if (!('instr_lists' in manasObj)) {
            return;
        }

        if (!('operations' in manasObj)) {
            return;
        }

        if (!('constraints' in manasObj)) {
            return;
        }

        if ('flowchart' in manasObj) {
            hasGraph = true;
        }

        isaData = manasObj.isa;
        refreshHomepage(true);

        if (hasGraph) {
            restoreWithGraph(manasObj);
        } else {
            restoreWithoutGraph(manasObj);
        }

    }

    /**
     * 
     * @param {any} newISA
     */
    function refreshHomepage(newISA) {
        clearContent(newISA);
        clearVariables(newISA);
        initCell();
        prepareCodeContentField();
        if (newISA) {
            prepareInstructionInfo();
            loadInstrOptions();
        }
        if (Object.keys(instructionMap).length > 0) {
            initRelation();
        }
    }
    /**
     * 
     * @param {any} newISA
     */
    function clearVariables(newISA) {
        instrID = 1;
        textareaWl = 0;
        updateSpanWl(textareaWl);
        programManager = {};

        if (!newISA) {
            return;
        }
            
        for (const key in instructionMap) {
            delete instructionMap[key];
        }
    }
    /**
     * 
     * @param {any} newISA
     */
    /* Remove current content before appending the new one */
    function clearContent(newISA) {
        document.getElementById("userInput").value = null;
        document.getElementById("editableFields").innerHTML = "";

        if (!newISA) {
            return;
        }

        var instrOptionsSelect = document.getElementById('showInstrOptions');
        var optionInstruction = document.createElement('option');

        optionInstruction.selected = true;
        optionInstruction.innerText = "Instruction Set";
        instrOptionsSelect.innerHTML = "";
        instrOptionsSelect.appendChild(optionInstruction);
    }
    /**
     * 
     * @param {any} 
     */
    function prepareInstructionInfo() {
        var insTemplates = isaData.instruction_templates;
        var insCounter = 0;

        for (let i in insTemplates) {
            insCounter += 1;
            instructionMap[insCounter] = insTemplates[i].name;
            phaseObj[insTemplates[i].name] = insTemplates[i].phase;
        }
    }

    /**
     * 
     * @param {any} 
     */
    /* append new instruction options */
    function loadInstrOptions() {
        var instrOptionsSelect = document.getElementById('showInstrOptions');
        var keyArray = Object.keys(instructionMap);

        if (keyArray.length > 0) {
            instrOptionsSelect[0].innerHTML = "Instruction Set (" + keyArray.length + ") ";
        }
        else {
            return;
        }

        for (let i = 0; i < keyArray.length; i++) {
            var optionInstruction = document.createElement('option');

            optionInstruction.value = keyArray[i];
            optionInstruction.innerHTML = instructionMap[keyArray[i]];

            instrOptionsSelect.appendChild(optionInstruction);
        }
        instrOptionsSelect.addEventListener("change", handleNewInstructionSelect);
    }

    function progLineFromList(insArray, cellList) {
        let count = 0;
        var insTemplates = isaData.instruction_templates;

        for (; count < insArray.length; count++) {
            var insItem = insArray[count];
            var insertContent = insItem.name;
            var segValues = insItem.segment_values;
            var defaultVal = 0;

            for (let item in insTemplates) {
                if (insTemplates[item].name == insItem.name) {
                    var segmentList = insTemplates[item].segment_templates;
                    for (let segItem in segmentList) {
                        var segName = segmentList[segItem].name;
                        var segval = segValues[segName];
                        if (typeof segval != 'undefined') {
                            insertContent += ", " + segName + "=" + segval;
                        }
                        else {
                            insertContent += ", " + segName + "=" + defaultVal;
                        }
                    }
                    break;
                }
            }

            if (insertContent.indexOf(',') > 0) {
                insertContent = insertContent.substring(0, insertContent.indexOf(',')) + insertContent.substring(insertContent.indexOf(',') + 1, insertContent.length);
            } else {
                insertContent = insertContent + " ";
            }
            
            let pLine = new programLine();
            pLine.createLineFromUserInput(insertContent);

            var timeLabel = insItem.timelabels[0][1];
            if (timeLabel != "") {
                pLine.setId(timeLabel.substring(3, timeLabel.lastIndexOf("_")));
            } else {
                pLine.setId(getLineNumberString(insItem.id));
            }
            pLine.setImmediate(insItem.immediate);
            pLine.setSegmentValuesStr(insItem.segment_values_str);
            pLine.setTimelabels(insItem.timelabels);
            pLine.setTimestamps(insItem.timestamps);

            cellString = '';
            for (let key in cellList) {
                cellItem = cellList[key];
                let index = 0;
                for (; index < cellItem.length; index++) {
                    if (cellItem[index] == insItem.id) {
                        cellString = key;
                        break;
                    }
                }
                if (cellString.length > 0) {
                    break;
                }
            }
            pLine.setCellPosition(Number(cellString[0]), Number(cellString[2]));

            programManager[pLine.getLineNum()] = pLine;
            appendNewLineToCellArray(pLine);
            var nodeArray = pLine.getNodeArray();
            for (let num = 0; num < nodeArray.length; num++) {
                createNode(nodeArray[num]);
            }
            updateSpanWl(pLine.getLineNum());

        }
    }

    function restoreWithGraph(manasObj) {
        var graphData = manasObj.flowchart;
        if (typeof isaData.instruction_list != 'undefined') {
            progLineFromList(isaData.instruction_list, manasObj.instr_lists);
        }
        else {
            alert("Cannot find isa.instruction_list!");
        }

        //get group data, create opGroup withoutchild node
        //get group from flowchart
        //get group info from operations
        var opGroupsData = graphData.opGroups;
        var operationsData = manasObj.operations;
        var key = null;
        for (key in opGroupsData) {
            var gUnitId = key.slice(0, -2);
            var sub_num = Number(key.slice(-1));
            if (typeof relationManager[gUnitId] == 'undefined') {
                createGroupUnitData(gUnitId, opGroupsData[key].parent);
            }
            relationManager[gUnitId][sub_num] = opGroupsData[key];
            restoreOpGroup(gUnitId, key.slice(-1), relationManager[gUnitId][sub_num]);
            relationManager[gUnitId][sub_num].childNode = opGroupsData[key].childNode;

            if (typeof operationsData[gUnitId] != 'undefined') {
                relationManager[gUnitId].dont_touch = operationsData[gUnitId].dont_touch;
                relationManager[gUnitId].expand_loop = operationsData[gUnitId].expand_loop;
                relationManager[gUnitId].ignore_children = operationsData[gUnitId].ignore_children;
                relationManager[gUnitId].is_bulk = operationsData[gUnitId].is_bulk;
                relationManager[gUnitId].issue_slot = operationsData[gUnitId].issue_slot;
                relationManager[gUnitId].name = operationsData[gUnitId].name;
                relationManager[gUnitId].rot = operationsData[gUnitId].rot;
                relationManager[gUnitId].scheduled_time = operationsData[gUnitId].scheduled_time;
                relationManager[gUnitId].shift_factor = operationsData[gUnitId].shift_factor;
            } else {
                alert("Missing" + gUnitId + "in 'operations'!!!");
            }
        }

        var operatorsData = graphData.operators;
        for (key in operatorsData) {
            if (key.startsWith('Op_')) {
                var nodeData = operatorsData[key];
                if (!(key in nodeMap)) {
                    alert("Node " + key + " is not generated with instruction!!! It will be created anyway.");
                } 
                nodeMap[key] = nodeData;
                $('#flowchartworkspace').flowchart('createOperator', nodeMap[key].properties.title, nodeMap[key], true);
            }
        }

        //add links to flowchart
        var consList = manasObj.constraints;
        var newConstraintArray = [];
        key = null;
        for (key in consList) {
            constraintData = createConstraintData(consList[key].src, consList[key].dest, consList[key].d_hi, consList[key].d_lo);
            createConstraint(key, constraintData);
            newConstraintArray.push(key);
        }

        addLinkToFlowchartData(newConstraintArray);
    }

    function restoreWithoutGraph(manasObj) {
        if (typeof isaData.instruction_list != 'undefined') {
            progLineFromList(isaData.instruction_list, manasObj.instr_lists);
        }
        else {
            alert("Cannot find isa.instruction_list!");
        }

        //separate the normal node and group node from the "operations" and create nodeUnit for normal node.  
        var gUnitList = {};
        var opsList = manasObj.operations;
        var item = null;
        for (item in opsList) {
            var childrenArr0 = opsList[item].children0;
            var childrenArr1 = opsList[item].children1;
            if (childrenArr0 != null || childrenArr1 != null) {
                gUnitList[item] = opsList[item];
            } else {
                if (item in nodeMap) {
                    var nodeUnit = nodeMap[item];
                    nodeUnit.children0 = null;
                    nodeUnit.children1 = null;
                    nodeUnit.dont_touch = opsList[item].dont_touch;
                    nodeUnit.expand_loop = opsList[item].expand_loop;
                    nodeUnit.ignore_children = opsList[item].ignore_children;
                    nodeUnit.is_bulk = opsList[item].is_bulk;
                    nodeUnit.issue_slot = opsList[item].issue_slot;
                    nodeUnit.name = opsList[item].name;
                    nodeUnit.rot = opsList[item].rot;
                    nodeUnit.scheduled_time = opsList[item].scheduled_time;
                    nodeUnit.shift_factor = opsList[item].shift_factor;
                } else {
                    console.log("Unexpected node: " + item);
                }
            }
        }

        //add groups to flowchart before nodes 
        //order: topdown from ROOT so that child group can be placed inside the parent group
        if (!('ROOT' in gUnitList)) {
            alert("ROOT is missing.");
        } else {
            item = null;
            var gUnitId = "ROOT";
            var gUnitStack = [];

            gUnitStack.push("ROOT");
            while (gUnitStack.length > 0) {
                gUnitId = gUnitStack.pop();
                var gUnitData = gUnitList[gUnitId];
                relationManager[gUnitId].dont_touch = gUnitData.dont_touch;
                relationManager[gUnitId].expand_loop = gUnitData.expand_loop;
                relationManager[gUnitId].ignore_children = gUnitData.ignore_children;
                relationManager[gUnitId].is_bulk = gUnitData.is_bulk;
                relationManager[gUnitId].issue_slot = gUnitData.issue_slot;
                relationManager[gUnitId].name = gUnitData.name;
                relationManager[gUnitId].rot = gUnitData.rot;
                relationManager[gUnitId].scheduled_time = gUnitData.scheduled_time;
                relationManager[gUnitId].shift_factor = gUnitData.shift_factor;

                if (gUnitData.children0 != null) {
                    for (let count = 0; count < gUnitData.children0.length; count++) {
                        var item = gUnitData.children0[count];
                        if (item in gUnitList) {
                            createOpGroup(item, "0", gUnitId, "0");
                        } else {
                            relationManager[gUnitId][0].childNode.push(item);
                            nodeMap[item].opGroup = gUnitId + "_0";
                        }
                    }
                }

                for (var j = 0; j < relationManager[gUnitId][0].childGroup.length; j++) {
                    gUnitStack.push(relationManager[gUnitId][0].childGroup[j]);
                }

                if (gUnitData.children1 != null) {
                    for (let count = 0; count < gUnitData.children1.length; count++) {
                        var item = gUnitData.children1[count];
                        if (item in gUnitList) {
                            createOpGroup(item, "0", gUnitId, "1");
                        } else {
                            relationManager[gUnitId][1].childNode.push(item);
                            nodeMap[item].opGroup = gUnitId + "_1";
                        }
                    }
                }

                for (var j = 0; j < relationManager[gUnitId][1].childGroup.length; j++) {
                    gUnitStack.push(relationManager[gUnitId][1].childGroup[j]);
                }

            }
        }

        //add nodes to flowchart at the default position in parent opGroup
        var key = null;
        for (key in nodeMap) {
            var newOperatorData = nodeMap[key];
            $('#flowchartworkspace').flowchart('createOperator', newOperatorData.properties.title, newOperatorData, false);
        }     

        //add links to flowchart
        var consList = manasObj.constraints;
        var newConstraintArray = [];
        key = null;
        for (key in consList) {
            constraintData = createConstraintData(consList[key].src, consList[key].dest, consList[key].d_hi, consList[key].d_lo);
            createConstraint(key, constraintData);
            newConstraintArray.push(key);
        }       
        
        addLinkToFlowchartData(newConstraintArray);
    }

    /**
     * 
     * 
     * Program module
     * 
     * /

    /**
     * 
     * @param {any} evt
     */
    /* Update user input field if user selects an instruction option or a line */
    function handleNewInstructionSelect(evt) {
        var selectedInstr = instructionMap[evt.target.value];

        if (typeof selectedInstr == "string") {
            document.getElementById("cellUnit").innerHTML = "<-,->"
            document.getElementById("editableFields").innerHTML = "";
            prepareEditableFields(true, selectedInstr, null, null);
        }
        else {
            document.getElementById("cellUnit").innerHTML = "<-,->"
            document.getElementById("userInput").value = null;
            document.getElementById("editableFields").innerHTML = "";
        }
    }

    /**
     * 
     * @param {any} content
     */
    function loadselectedProgramLine(content) {
        var lineId = Number(content.substring(0, 4));
        var pLine = programManager[lineId];
        if (pLine instanceof programLine) {
            var instructionName = pLine.getName();
            var segmentOptStr = pLine.getSegmentOptionStr();
            var cellPosition = pLine.getCellPosition();

            document.getElementById("editableFields").innerHTML = "";
            prepareEditableFields(false, instructionName, segmentOptStr, cellPosition[0] + "," + cellPosition[1]);
        } else {
            document.getElementById("cellUnit").innerHTML = "<-,->"
            document.getElementById("userInput").value = null;
            document.getElementById("editableFields").innerHTML = "";
        }
    }

    /**
     * 
     * @param {any} isNewInstruction
     * @param {any} selectedInstr
     * @param {any} segmentOptStr
     * @param {any} cellPosition
     */
    function prepareEditableFields(isNewInstruction, selectedInstr, segmentOptStr, cellPosition) {
        var insTemplates = isaData.instruction_templates;
        var cellUnitField = document.getElementById("cellUnit");
        var instrInputField = document.getElementById("userInput");
        var editableFields = document.getElementById("editableFields");

        for (let i in insTemplates) {
            if (insTemplates[i].name == selectedInstr) {
                var segmentList = insTemplates[i].segment_templates;
                var segmentOptionArray;
                var segmentOptionObject = {};
                var segmentCounter = 1;

                currentSelectedInstr = insTemplates[i].name + " ";
                instrInputField.value = currentSelectedInstr;

                if (!isNewInstruction) {
                    instrInputField.value += segmentOptStr;
                    cellUnitField.innerHTML = "<" + cellPosition + ">";
                    segmentOptionArray = segmentOptStr.split(', ');
                    for (var counter = 0; counter < segmentOptionArray.length; counter += 1) {
                        var segmentPair = segmentOptionArray[counter].split('=');
                        segmentOptionObject[String(segmentPair[0])] = segmentPair[1];
                    }
                }

                /*Add select for cell<row,column>.
                <div class="input-group mb-2 input-group-sm">
                        <div class="input-group-prepend">
                            <label class="input-group-text" for="selectRow">Row</label>
                        </div>
                        <select class="custom-select" id="selectRow" title="row">
                            <option value="0">0</option>
                            <option value="1">1</option>
                        </select>
                        <div class="input-group-prepend">
                            <label class="input-group-text" for="selectColumn">Column</label>
                        </div>
                        <select class="custom-select" id="selectColumn" title="column">
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </select>
                </div>
                */
                var divInputGroupCell = document.createElement('div');
                divInputGroupCell.className = "input-group mb-2 input-group-sm";

                var divPrependRow = document.createElement('div');
                divPrependRow.className = "input-group-prepend";

                var labelRow = document.createElement('label');
                labelRow.className = "input-group-text";
                labelRow.setAttribute("for", "selectRow");
                labelRow.innerText = "row";

                divPrependRow.appendChild(labelRow);
                divInputGroupCell.appendChild(divPrependRow);

                var selectRowValue = document.createElement('select');
                selectRowValue.className = "custom-select";
                selectRowValue.id = "selectRow";
                selectRowValue.title = "row";

                for (var count = 0; count < 2; count++) {
                    var optionRowValue = document.createElement('option');
                    optionRowValue.value = count;
                    optionRowValue.innerHTML = count;
                    selectRowValue.appendChild(optionRowValue);
                }

                if (cellPosition != null) {
                    selectRowValue.selectedIndex = Number(cellPosition[0]);
                }

                divInputGroupCell.appendChild(selectRowValue);

                var divPrependColumn = document.createElement('div');
                divPrependColumn.className = "input-group-prepend";

                var labelColumn = document.createElement('label');
                labelColumn.className = "input-group-text";
                labelColumn.setAttribute("for", "selectColumn");
                labelColumn.innerText = "column";

                divPrependColumn.appendChild(labelColumn);
                divInputGroupCell.appendChild(divPrependColumn);

                var selectColumnValue = document.createElement('select');
                selectColumnValue.className = "custom-select";
                selectColumnValue.id = "selectColumn";
                selectColumnValue.title = "column";

                for (var count = 0; count < 3; count++) {
                    var optionColumnValue = document.createElement('option');
                    optionColumnValue.value = count;
                    optionColumnValue.innerHTML = count;
                    selectColumnValue.appendChild(optionColumnValue);
                }

                if (cellPosition != null) {
                    selectColumnValue.selectedIndex = Number(cellPosition[2]);
                }

                divInputGroupCell.appendChild(selectColumnValue);

                editableFields.appendChild(divInputGroupCell);

                for (let j in segmentList) {
                    /*  append the following block for each segment to collapse (id = editableFields) */
                    /*
                          <div class="input-group my-2 input-group-sm">
                               <div class="input-group-prepend">
                                   <span class="input-group-text">Field Name</span>
                               </div>
                               <input type="text" class="form-control">
                          </div>
                    */
                    var isControllable = segmentList[j].controllable; //type = undefined or boolean; content = undefined or true/false
                    //console.log("isControllable(" + typeof isControllable + "): " + isControllable);

                    var isObservable = segmentList[j].observable; //type = undefined or boolean; content = undefined or true/false
                    //console.log("isObservable(" + typeof isObservable + "): " + isObservable);

                    var comment = segmentList[j].comment;

                    var default_value = segmentList[j].default_val; //type = undefined or number; content = undefined or digits
                    //console.log("default_val(" + typeof default_value + "): " + default_value);

                    var verboMap = segmentList[j].verbo_map;//type = undefined or object; content = undefined or [object Object],[object Object],[object Object],[object Object]
                    //console.log("verbo_map(" + typeof verboMap + "): " + verboMap);
                    /*
                    if (typeof verboMap != "undefined") {
                        for (var k = 0; k < verboMap.length; k++) {
                            console.log("verbo_pair(" + typeof verboMap[k] + "): " + verboMap[k]);
                            console.log("verbo_key(" + typeof verboMap[k].key + "): " + verboMap[k].key);
                            console.log("verbo_value(" + typeof verboMap[k].val + "): " + verboMap[k].val);
                        }
                    }
                    */
                    if (typeof isControllable != "undefined") {
                        if (isControllable == false) {
                            continue;
                        }
                    }

                    if (typeof isObservable != "undefined") {
                        if (isObservable == false) {
                            continue;
                        }
                    }

                    var divInputGroup = document.createElement('div');
                    divInputGroup.className = "input-group my-2 input-group-sm";

                    var divPrepend = document.createElement('div');
                    divPrepend.className = "input-group-prepend";

                    var spanSegName = document.createElement('span');
                    spanSegName.className = "input-group-text";
                    spanSegName.innerText = segmentList[j].name;

                    divPrepend.appendChild(spanSegName);
                    divInputGroup.appendChild(divPrepend);

                    var inputSegmentValue = document.createElement('input');
                    inputSegmentValue.className = "form-control";
                    inputSegmentValue.type = "text";


                    if (segmentList[j].bitwidth == "1") {
                        inputSegmentValue.setAttribute("widthLimit", "1 bit");
                    } else {
                        inputSegmentValue.setAttribute("widthLimit", segmentList[j].bitwidth + " bits");
                    }


                    if (typeof comment != "undefined") {
                        inputSegmentValue.title += comment + "\n";
                    }

                    if (typeof verboMap != "undefined") {
                        for (var k = 0; k < verboMap.length; k++) {
                            inputSegmentValue.title += verboMap[k].key + " : " + verboMap[k].val + "\n";
                        }
                    }

                    if (typeof default_value != "undefined") {
                        inputSegmentValue.value = default_value;
                    } else {
                        inputSegmentValue.value = 0;
                    }

                    if (!isNewInstruction) {
                        var segValue = segmentOptionObject[segmentList[j].name];
                        if (typeof segValue != "undefined") {
                            inputSegmentValue.value = segValue;
                        }
                    }

                    segmentCounter += 1;
                    divInputGroup.appendChild(inputSegmentValue);
                    editableFields.appendChild(divInputGroup);
                }

                /*
                <button class="btn btn-secondary btn-sm" type="button" onClick="completeInput()">
                   OK
                </button>
                */
                var buttonCompleteInput = document.createElement('button');
                var buttonClearInput = document.createElement('button');

                buttonCompleteInput.innerText = "OK";
                buttonCompleteInput.className = "btn btn-secondary btn-sm";
                buttonCompleteInput.type = "button";
                buttonCompleteInput.id = "completeInputButton";

                buttonClearInput.innerText = "Clear";
                buttonClearInput.className = "btn btn-secondary btn-sm";
                buttonClearInput.type = "button";
                buttonClearInput.id = "clearInputButton";
                buttonClearInput.style.margin = "0 0 0 5px";

                editableFields.appendChild(buttonCompleteInput);
                editableFields.appendChild(buttonClearInput);
                document.getElementById("buttonEdit").innerHTML = "EDIT(" + segmentCounter + ")";
                break;
            }
        }
    }

    $('#editableFields').on('click', '#completeInputButton', function () {
        completeInput();
    });

    $('#editableFields').on('click', '#clearInputButton', function () {
        clearInput();
    });
    /**
     * 
     * @param {any} 
     */
    function clearInput() {
        var editableFields = document.getElementById("editableFields");
        var inputCollection = editableFields.querySelectorAll('.form-control');//get input value
        var counts = 0;

        for (; counts < inputCollection.length; counts += 1) {
            inputCollection[counts].value = "";
        }

    }
    /**
     * 
     * @param {any} 
     */
    /*generate instruction line with user input*/
    function completeInput() {
        var cellUnitField = document.getElementById("cellUnit");
        var instrInputField = document.getElementById("userInput");
        var editableFields = document.getElementById("editableFields");
        var segCollection = editableFields.querySelectorAll('.input-group-text');//get segName [row,column,seg1,seg2,...]
        var cellCollection = editableFields.querySelectorAll('.custom-select');//get <select> of row and column
        var inputCollection = editableFields.querySelectorAll('.form-control');//get input value [segVal1, segVal2, ...]
        var allSegmentName = new Array(segCollection.length);
        var allSegmentValue = new Array(inputCollection.length);
        var allSegmentBitwidth = new Array(inputCollection.length);
        var userInputString = "";
        var digitPattern = /^[0-9]*$/;
        var counts;

        cellString = cellCollection[0].value + "," + cellCollection[1].value;

        cellUnitField.innerHTML = "<" + cellString + ">";

        counts = 0;
        for (; counts < segCollection.length - 2; counts += 1) {
            var bitwidthStr = inputCollection[counts].getAttribute('widthLimit');

            allSegmentName[counts] = segCollection[counts + 2].innerText;
            allSegmentValue[counts] = inputCollection[counts].value;
            allSegmentBitwidth[counts] = Number(bitwidthStr.substring(0, bitwidthStr.indexOf(" ")));
        }

        counts = 0;
        for (; counts < allSegmentName.length; counts += 1) {
            if (typeof allSegmentValue[counts] != "undefined" && allSegmentValue[counts] != "") {
                if (digitPattern.test(allSegmentValue[counts])) {
                    var value = Number(allSegmentValue[counts]);
                    if (value >= 0 && value < Math.pow(2, allSegmentBitwidth[counts])) {
                        userInputString += allSegmentName[counts] + "=" + allSegmentValue[counts] + ", ";
                    }
                    else {
                        alert("Invalid input: '" + allSegmentName[counts] + "=" + allSegmentValue[counts] + "' (out of range)");
                        return;
                    }
                }
                else {
                    alert("Must input positive number: '" + allSegmentName[counts] + "=" + allSegmentValue[counts] + "'");
                    return;
                }
            }
        }

        if (userInputString.length > 0) {
            instrInputField.value = currentSelectedInstr + userInputString.substring(0, userInputString.length - 2);
        } else {
            var insTemplates = isaData.instruction_templates;
            for (let i in insTemplates) {
                if (insTemplates[i].name == currentSelectedInstr.substring(0, currentSelectedInstr.length - 1)) {
                    if (Object.keys(insTemplates[i].segment_templates).length > 0) {
                        alert("Empty input.");
                    }
                }
            }

        }
    }

    $('#buttonInsert').click(function () {
        insertUserInput();
    });
    /**
     * 
     * @param {any} 
     */
    /* append user input into programming area*/
    function insertUserInput() {
        let pLine = new programLine();
        var insertContent = document.getElementById("userInput").value;
        
        //validate the input
        if (insertContent == "") {
            return;
        }

        pLine.createLineFromUserInput(insertContent);
        pLine.setCellPosition(Number(cellString[0]), Number(cellString[2]));
        programManager[pLine.getLineNum()] = pLine;
        appendNewLineToCellArray(pLine);
        appendNodeFromNewLine(pLine.getLineNum(), pLine.getNodeArray());
        updateSpanWl(pLine.getLineNum());
    }

    $('#buttonModify').click(function () {
        modifyUserSelect();
    });
    /**
     * 
     * @param {any} 
     */
    function modifyUserSelect() {
        var substituteContent = document.getElementById("userInput").value;
        let pLine = programManager[textareaWl];
        let oldCellPos = pLine.getCellPosition();

        if (substituteContent == "")
            return;

        pLine.createLineFromUserInput(substituteContent);
        pLine.setCellPosition(Number(cellString[0]), Number(cellString[2]));
        if (pLine.getCellPosition() == oldCellPos) {
            oldCellPos = null;
        }

        if (confirm('Modify line: "' + getLineNumberString(pLine.getLineNum()) + "  " + pLine.getUserInput() + '"?')) {
            programManager[pLine.getLineNum()] = pLine;
            modifyLineFromCellArray(pLine, oldCellPos);
        }
    }

    $('#buttonDelete').click(function () {
        deleteUserSelect();
    });
    /**
     * 
     * @param {any} 
     */
    function deleteUserSelect() {
        var instrInputField = document.getElementById("userInput");
        let pLine = programManager[textareaWl];

        if (instrInputField.value == "")
            return;

        if (pLine instanceof programLine) {
            if (confirm('Delete line: "' + getLineNumberString(pLine.getLineNum()) + "  " + pLine.getUserInput() + '"?')) {
                deleteLineFromCellArray(pLine.getCellPosition(), pLine.getLineNum());
                deleteNodeAlongWithProgramLine(pLine.getNodeArray());
                deleteConstraintAlongWithProgramLine(pLine.getNodeArray());
                delete programManager[textareaWl];
                instrInputField.value = "";
            }
        }
    }
    /**
     * 
     * @param {any} newVal
     */
    function updateSpanWl(newVal) {
        var spanWl = document.getElementById("workingLine");
        textareaWl = newVal;
        //console.log("Working on line: " + textareaWl);
        spanWl.innerText = getLineNumberString(textareaWl);
    }
    /**
     * 
     * @param {any} number
     */
    function getLineNumberString(number) {
        var addzero = "";

        if (number < 10) addzero = "000";
        else if (number < 100) addzero = "00";
        else if (number < 1000) addzero = "0";

        return (addzero + String(number));
    }

    /****************************************************CODE***********************************************************/

    /**
     * 
     * @param {any} evt
     */
    function handleClickOnCellUnitContainer(evt) {
        evt = evt || window.event;
        var target = evt.target || evt.srcElement, text = target.textContent || target.innerText;

        updateSpanWl(Number(text.substring(0, 4)));
        loadselectedProgramLine(text);
    }
    /**
     * 
     * @param {any} newLine
     */
    function appendNewLineToCellArray(newLine) {
        var cellRow = newLine.getCellPosition()[0];
        var cellColumn = newLine.getCellPosition()[1];
        var lineObj = {};

        if (typeof cellArray[cellRow][cellColumn] == "undefined") {
            cellArray[cellRow][cellColumn] = new Array();
        }
        lineObj["ID"] = getLineNumberString(newLine.getLineNum());
        lineObj["Content"] = newLine.getUserInput();
        cellArray[cellRow][cellColumn].push(lineObj);
        prepareCodeContentField();
    }
    /**
     * 
     * @param {any} newLine
     * @param {any} oldCellPos
     */
    function modifyLineFromCellArray(newLine, oldCellPos) {
        var cellRow = newLine.getCellPosition()[0];
        var cellColumn = newLine.getCellPosition()[1];
        var newLineObj = {};

        if (typeof cellArray[cellRow][cellColumn] == "undefined") {
            return;
        }

        newLineObj["ID"] = getLineNumberString(newLine.getLineNum());
        newLineObj["Content"] = newLine.getUserInput();

        if (oldCellPos != null) {
            var oldCellRow = oldCellPos[0];
            var oldCellCol = oldCellPos[1];
            if (typeof cellArray[oldCellRow][oldCellCol] != 'undefined') {
                for (count = 0; count < cellArray[oldCellRow][oldCellCol].length; count++) {
                    var lineObj = cellArray[oldCellRow][oldCellCol][count];
                    if (lineObj.ID == newLineObj.ID) {
                        cellArray[oldCellRow][oldCellCol].splice(count, 1);
                        break;
                    }
                }
            } else {
                alert("Cell unit is not defined!");
            }
            
            cellArray[cellRow][cellColumn].push(newLineObj);
        } else {
            for (count = 0; count < cellArray[cellRow][cellColumn].length; count++) {
                var lineObj = cellArray[cellRow][cellColumn][count];
                if (lineObj.ID == newLineObj.ID) {
                    cellArray[cellRow][cellColumn][count] = newLineObj;
                    break;
                }
            }
        }

        prepareCodeContentField();
    }
    /**
     * 
     * @param {any} cell
     * @param {any} lineID
     */
    function deleteLineFromCellArray(cell, lineID) {
        var cellRow = cell[0];
        var cellColumn = cell[1];
        var idStr = getLineNumberString(lineID);
        if (typeof cellArray[cellRow][cellColumn] == "undefined") {
            return;
        }

        for (count = 0; count < cellArray[cellRow][cellColumn].length; count++) {
            var lineObj = cellArray[cellRow][cellColumn][count];
            if (lineObj.ID == idStr) {
                cellArray[cellRow][cellColumn].splice(count, 1);
                break;
            }
        }
        prepareCodeContentField();
    }
    /**
     * 
     * @param {any} 
     */
    function prepareCodeContentField() {
        /*
        <div class="container">
          <div class="row">
            <div class="list-group">
              <div class="list-group-item list-group-item-action flex-column align-items-start active">
                CELL<r,c>
              </div>

              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <p>line 1</p>
              </div>
              ...
            </div>
          </div>
          <div class="row">...</div>
          <div class="row">...</div>
          <div class="row">...</div>
          <div class="row">...</div>
          <div class="row">...</div>
        </div>
        */
        var divCodeField = document.getElementById("cellUnitContainer");
        divCodeField.innerHTML = "";
        for (var idx = 0; idx < 6; idx++) {
            var row = parseInt(idx / 3);
            var column = idx % 3;
            if (typeof cellArray[row][column] != "undefined" && cellArray[row][column].length > 0) {
                var divCellUnitRow = document.createElement("div");
                divCellUnitRow.className = "row";
                var divCellListGroup = document.createElement("div");
                divCellListGroup.className = "list-group";

                var divUnitName = document.createElement('div');
                divUnitName.className = "list-group-item align-items-start active";
                divUnitName.innerHTML = "CELL <" + row + "," + column + ">";
                divCellListGroup.appendChild(divUnitName);

                for (count = 0; count < cellArray[row][column].length; count++) {
                    var lineObj = cellArray[row][column][count];
                    var divInstrLine = document.createElement('div');
                    divInstrLine.className = "list-group-item align-items-start";
                    var spanInstrID = document.createElement('span');
                    spanInstrID.className = "font-weight-bold";
                    spanInstrID.innerHTML = lineObj.ID + "&nbsp;&nbsp;";
                    divInstrLine.appendChild(spanInstrID);
                    divInstrLine.innerHTML += lineObj.Content;
                    divCellListGroup.appendChild(divInstrLine);
                }
                divCellUnitRow.appendChild(divCellListGroup);
                divCodeField.appendChild(divCellUnitRow);
            }
        }

    }

    /**************************************************RELATION*********************************************************/
    var relationManager = {};
    var nodeMap = {};

    //-----------------------------------------
    //--------------GroupUnit------------------
    //-----------------------------------------
    /**
     * 
     * @param {any} groupUnitId
     * @param {any} parentId
     */
    function createGroupUnitData(groupUnitId, parentId) {
        var groupUnitData = {
            0: {
                isPainted: false,
                title: groupUnitId + "_0",
                parent: parentId,
                childGroup: [],
                childNode: [],
                geometric: {
                    rect_x: 30,
                    rect_y: 110,
                    rect_width: 300,
                    rect_height: 500
                },
                headNode: {
                    top: 10,
                    left: 10,
                    opGroup: parentId,
                    properties: {
                        title: groupUnitId,
                        inputs: {
                            input_1: {
                                label: ' ',
                            },
                        },
                        outputs: {
                            output_1: {
                                label: ' ',
                            },
                        }
                    }
                },
                entry: {
                    top: 10,
                    left: 10,
                    opGroup: groupUnitId + "_0",
                    properties: {
                        title: groupUnitId + "_0",
                        inputs: {
                            input_1: {
                                label: ' ',
                            },
                        }
                    }
                }
            },
            1: {
                isPainted: false,
                title: groupUnitId + "_1",
                parent: parentId,
                childGroup: [],
                childNode: [],
                geometric: {
                    rect_x: 30,
                    rect_y: 110,
                    rect_width: 300,
                    rect_height: 500
                },
                headNode: {
                    top: 10,
                    left: 10,
                    opGroup: parentId,
                    properties: {
                        title: groupUnitId,
                        inputs: {
                            input_1: {
                                label: ' ',
                            },
                        },
                        outputs: {
                            output_1: {
                                label: ' ',
                            },
                        }
                    }
                },
                entry: {
                    top: 10,
                    left: 10,
                    opGroup: groupUnitId + "_1",
                    properties: {
                        title: groupUnitId + "_1",
                        inputs: {
                            input_1: {
                                label: ' ',
                            },
                        }
                    }
                }
            },
            dont_touch: false,
            expand_loop: false,
            ignore_children: false,
            is_bulk: false,
            issue_slot: '',
            rot: null,
            scheduled_time: -1,
            shift_factor: 0
        }

        relationManager[groupUnitId] = groupUnitData;
    }
    /**
     * 
     * @param {any} opGroupId
     * @param {any} opGroupData
     */
    function updateOpGroupData(opGroupId, opGroupData) {
        var groupUnitId = opGroupId.slice(0, -2);
        relationManager[groupUnitId][opGroupId.slice(-1)] = opGroupData;
    }
    /**
     * 
     * @param {any} opGroupId
     */
    function deleteOpGroupData(opGroupId) {
        var groupUnitId = opGroupId.slice(0, -2);
        var sub_num = opGroupId.slice(-1);
        var opGrData = relationManager[groupUnitId][sub_num];
        if (typeof opGrData != 'undefined') {
            //MOVE NODE TO PARENT
            //MOVE GROUP TO PARENT
            var nodeArray = opGrData.childNode;
            var groupArray = opGrData.childGroup;
            var parentGroupUnit = opGrData.parent.slice(0, -2);
            var parentSub_num = Number(opGrData.parent.slice(-1));
            var parentOpGrData = relationManager[parentGroupUnit][parentSub_num];
            if (typeof parentOpGrData != 'undefined') {
                var i = 0;
                for (; i < nodeArray.length; i++) {
                    var nodeData = nodeMap[nodeArray[i]];
                    if (typeof nodeData != 'undefined') {
                        nodeData.opGroup = parentOpGrData.title;
                    }
                }
                parentOpGrData.childNode.push.apply(parentOpGrData.childNode, nodeArray);

                for (i = 0; i < groupArray.length; i++) {
                    var childGroupUnit = relationManager[groupArray[i].slice(0, -2)];
                    if (typeof childGroupUnit != 'undefined') {
                        childGroupUnit["0"].parent = parentOpGrData.title;
                        childGroupUnit["0"].headNode.opGroup = parentOpGrData.title;
                        childGroupUnit["1"].parent = parentOpGrData.title;
                        childGroupUnit["1"].headNode.opGroup = parentOpGrData.title;
                    }
                    
                }
                parentOpGrData.childGroup.push.apply(parentOpGrData.childGroup, groupArray);
            }
        }

        opGrData.isPainted = false;
        removeOpGroupFromParentList(opGroupId);

        var removeAll = false;
        if (sub_num == "0" && relationManager[groupUnitId]["1"].isPainted == false) {
            removeAll = true;
        } else if (sub_num == "1" && relationManager[groupUnitId]["0"].isPainted == false) {
            removeAll = true;
        }

        if (removeAll) {
            delete relationManager[groupUnitId];
        }
    }
    /**
     * 
     * @param {any} nodeId
     */
    function removeNodeFromParentList(nodeId) {
        var nodeData = nodeMap[nodeId];
        if (typeof nodeData == 'undefined') {
            return;
        }

        var parentGroupUnit = relationManager[nodeData.opGroup.slice(0, -2)];
        if (typeof parentGroupUnit == 'undefined') {
            alert("[removeNodeFromParentList] Failed to find parent group unit!");
            return;
        }
        var parentOpGr = parentGroupUnit[nodeData.opGroup.slice(-1)];
        for (var i = 0; i < parentOpGr.childNode.length; i++) {
            if (parentOpGr.childNode[i] == nodeId) {
                parentOpGr.childNode.splice(i, 1);
            }
        }
    }


    /**
     * 
     * @param {any} opGroupId
     */
    function removeOpGroupFromParentList(opGroupId) {
        var sub_num = 0;
        var opGr = relationManager[opGroupId.slice(0, -2)][sub_num];
        var parentOpGr = relationManager[opGr.parent.slice(0, -2)][opGr.parent.slice(-1)];

        if (typeof parentOpGr == 'undefined') {
            alert("[removeOpGroupFromParentList] Failed to find parent opGroup!");
            return;
        }
        for (i = 0; i < parentOpGr.childGroup.length; i++) {
            if (parentOpGr.childGroup[i] == opGroupId) {
                parentOpGr.childGroup.splice(i, 1);
            }
        }
    }

    /**
     * 
     * @param {any} groupUnitId
     */
    function removeGroupUnitFromParentList(groupUnitId) {
        var sub_num = 0;
        var opGr = relationManager[groupUnitId][sub_num];
        var parentOpGr = relationManager[opGr.parent.slice(0, -2)][opGr.parent.slice(-1)];

        if (typeof parentOpGr == 'undefined') {
            alert("[removeGroupUnitFromParentList] Failed to find parent opGroup!");
            return;
        }
        for (i = 0; i < parentOpGr.childGroup.length; i++) {
            if (parentOpGr.childGroup[i] == (groupUnitId + '_0') || parentOpGr.childGroup[i] == (groupUnitId + '_1')) {
                parentOpGr.childGroup.splice(i, 1);
            }
        }
    }

    //-----------------------------------------
    //---------------NodeUnit------------------
    //-----------------------------------------
    /**
     * 
     * @param {any} nodeId
     */
    function createNode(nodeId) {
        var nodeData = {
            top: 0,
            left: 0,
            opGroup: "ROOT_0",
            properties: {
                title: nodeId,
                inputs: {
                    input_1: {
                        label: "",
                    },
                },
                outputs: {
                    output_1: {
                        label: "",
                    },
                }
            },
            dont_touch: false,
            expand_loop: false,
            ignore_children: false,
            is_bulk: false,
            issue_slot: '',
            rot: null,
            scheduled_time: -1,
            shift_factor: 0
        };

        nodeMap[nodeId] = nodeData;
    }
    /**
     * 
     * @param {any} nodeId
     * @param {any} opData
     */
    function updateNodeData(nodeId, opData) {
        var nodeData = $.extend(true, {}, opData);
        if (nodeData.hasOwnProperty("internal")) {
            delete nodeData.internal;
        }
        nodeMap[nodeId] = nodeData;
    }
    /**
     * 
     * @param {any} nodeId
     */
    function deleteNode(nodeId) {
        var nodeData = nodeMap[nodeId];
        if (typeof nodeData == 'undefined') {
            return;
        }

        removeNodeFromParentList(nodeId);
        delete nodeMap[nodeId];
    }
    /**
     * 
     * @param {any} 
     */
    function loadGroupUnitOptions() {
        var parentGroupOptionsSelect = document.getElementById('showParentGroupOptions');
        var keyArray = Object.keys(relationManager);
        parentGroupOptionsSelect.innerHTML = "";
        if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
                var optionParentGroupUnit = document.createElement('option');

                optionParentGroupUnit.value = i;
                optionParentGroupUnit.innerHTML = keyArray[i];

                parentGroupOptionsSelect.appendChild(optionParentGroupUnit);
            }
        }
    }
    
    /**
     * 
     * @param {any} nodeArray
     */
    function appendNodeFromNewLine(pLineNum, nodeArray) {
        for (let count = 0; count < nodeArray.length; count++) {
            createNode(nodeArray[count]);
            var sub_num = "0";
            relationManager["ROOT"][sub_num].childNode.push(nodeArray[count]);
        }

        addOperatorToFlowchartData(nodeArray);
        addConstriantForInnerNode(pLineNum, nodeArray);
    }
    /**
     * 
     * @param {any} nodeArray
     */
    function deleteNodeAlongWithProgramLine(nodeArray) {
        for (let i = 0; i < nodeArray.length; i++) {
            deleteNode(nodeArray[i]);
        }

        deleteOperatorFromFlowchart(nodeArray);
    }

    /*************************************************DEPENDENCY********************************************************/
    var dependencyManager = {};
    /**
     * 
     * @param {any} startArg
     * @param {any} endArg
     * @param {any} val_0
     * @param {any} val_1
     */
    function createConstraintData(startArg, endArg, val_0, val_1) {
        return {
            fromOperator: startArg,
            fromConnector: "output_1",
            toOperator: endArg,
            toConnector: "input_1",
            constraint0: val_0,
            constraint1: val_1,
        };
    }
    /**
     * 
     * @param {any} constraintId
     * @param {any} constraintData
     */
    function createConstraint(constraintId, constraintData) {
        dependencyManager[constraintId] = constraintData;
    }
    /**
     * 
     * @param {any} constraintId
     * @param {any} constraintData
     */
    function updateConstraint(constraintId, constraintData) {
        if (constraintId in dependencyManager) {
            dependencyManager[constraintId] = constraintData;
        }
    }
    /**
     * 
     * @param {any} constraintId
     */
    function deleteConstraint(constraintId) {
        delete dependencyManager[constraintId];
    }
    /**
     * 
     * @param {any} nodeArray
     */
    function addConstriantForInnerNode(pLineNum, nodeArray) {
        if (nodeArray.length < 2) {
            return;
        }
        var newConstraintArray = [];
        var pLine = programManager[pLineNum];//get program line by id

        var consObj = pLine.getConstraints();

        for (let count = 0; count < nodeArray.length - 1; count++) {
            var constraintId = nodeArray[count] + "_" + nodeArray[count + 1];
            var consKey = count + "-" + (count + 1);
            var consValue = consObj[consKey];
            var constraintData = {};

            if (typeof consValue != 'undefined') {
                constraintData = createConstraintData(nodeArray[count], nodeArray[count + 1], consValue["c1"], consValue["c2"]);
            } else {
                constraintData = createConstraintData(nodeArray[count], nodeArray[count + 1], "0", "0");
            }
             
            createConstraint(constraintId, constraintData);
            newConstraintArray.push(constraintId);
        }
        addLinkToFlowchartData(newConstraintArray);
    }
    /**
     * 
     * @param {any} nodeArray
     */
    function deleteConstraintAlongWithProgramLine(nodeArray) {
        var keyArray = Object.keys(dependencyManager);

        for (let i = 0; i < keyArray.length; i++) {
            for (let j = 0; j < nodeArray.length; j++) {
                if (keyArray[i].indexOf(nodeArray[j]) > 0) {
                    delete dependencyManager[keyArray[i]];
                }
            }
        }
    }

    $('input[type="radio"]').click(function () {
        var inputID = $(this).attr("id");
        var index = inputID.charAt(inputID.length - 1);
        var type = inputID.substring(0, inputID.length - 1);
        if (type == "flexRadioNumber") {
            $('#ConstraintInput' + index).show();
        } else {
            $('#ConstraintInput' + index).hide();
        }
    });
    /***************************************************Canvas**********************************************************/

    var defaultFlowchartData = {
        operators: {},
        links: {},
        opGroups: {}
    };

    var $flowchart = $('#flowchartworkspace');

    // Apply the plugin on a standard, empty div...
    $flowchart.flowchart({
        data: defaultFlowchartData,
        defaultSelectedLinkColor: '#3366ff',
        linkWidth: 1,
        grid: 10,
        multipleLinksOnInput: true,
        multipleLinksOnOutput: true,
        verticalConnection: true,
    });

    //zoom

    const elem = document.getElementById('flowchartworkspace');
    const panzoom = Panzoom(elem, {
        maxScale: 5,
        overflow: scroll,
    });
    panzoom.zoom(1, { animate: true });

    $('#zoom_ori').click(function () {
        panzoom.zoom(1, { animate: true });
        $flowchart.flowchart('setPositionRatio', panzoom.getScale());
    });

    $('#zoom_in').click(function () {
        panzoom.zoomIn();
        $flowchart.flowchart('setPositionRatio', panzoom.getScale());
    });

    $('#zoom_out').click(function () {
        panzoom.zoomOut();
        $flowchart.flowchart('setPositionRatio', panzoom.getScale());
    });

    $('#find_operator_button').click(function () {
        var opTitle = $('#find_operator_by_title').val();
        if (opTitle == null) {
            alert("Empty title");
            return;
        }
        var key = null;
        for (key in nodeMap) {
            if (key == opTitle) {
                var opData = nodeMap[key];
                var currentPan = panzoom.getPan();
                panzoom.pan(currentPan.x - opData.left, currentPan.y - opData.top, { relative: true });
                return;
            }
        }
        alert("Unknown node title: " + opTitle);
    })

    //-----------------------------------------
    //--- operator and link properties
    //--- start
    var $operatorProperties = $('#operator_properties');
    $operatorProperties.hide();
    var $linkPropertiesStatic = $('#link_properties_static');
    $linkPropertiesStatic.hide();
    var $linkPropertiesAdvanced = $('#link_properties_advanced');
    $linkPropertiesAdvanced.hide();

    var $operatorTitle = $('#operator_title');
    var $operatorGroup = $('#operator_group');

    var $linkTitle = $('#link_title');
    var $linkColor = $('#link_color');
    var $linkFrom = $('#link_from');
    var $linkTo = $('#link_to');

    $flowchart.flowchart({
        onOperatorSelect: function (operatorId) {
            $opGroupProperties.hide();

            if (!operatorId.startsWith("Op_")) {
                $('#delete_selected').prop('disabled', false);
            } else {
                $('#delete_selected').prop('disabled', true);
            }

            if (!(operatorId.startsWith("Op_") || operatorId in relationManager)) {
                $operatorProperties.hide();   
                return true;
            }

            selectedComponent = { id: operatorId, type: "operator"};
            
            $operatorProperties.show();
            var operatorInfos = $flowchart.flowchart('getOperatorInfos', operatorId);
            $operatorTitle.val(operatorInfos[0]);
            $operatorGroup.val(operatorInfos[1]);

            var operationData = null;
            if (operatorId.startsWith("Op_")) {
                operationData = nodeMap[operatorId];
            } else if (operatorId in relationManager) {
                operationData = relationManager[operatorId];
            }

            if (operationData == null) {
                $operatorProperties.hide();
                return true;
            }
            //console.log(operationData);
            
            if (operationData.dont_touch == true) {
                $('#dontTouchFalse').prop('checked', false);
                $('#dontTouchTrue').prop('checked', true);
            } else {
                $('#dontTouchTrue').prop('checked', false);
                $('#dontTouchFalse').prop('checked', true);
            }

            if (operationData.expand_loop == true) {
                $('#expandLoopFalse').prop('checked', false);
                $('#expandLoopTrue').prop('checked', true);
            } else {
                $('#expandLoopTrue').prop('checked', false);
                $('#expandLoopFalse').prop('checked', true);
            }

            if (operationData.ignore_children == true) {
                $('#ignoreChildrenFalse').prop('checked', false);
                $('#ignoreChildrenTrue').prop('checked', true);
            } else {
                $('#ignoreChildrenTrue').prop('checked', false);
                $('#ignoreChildrenFalse').prop('checked', true);
            }

            if (operationData.is_bulk == true) {
                $('#isBulkFalse').prop('checked', false);
                $('#isBulkTrue').prop('checked', true);
            } else {
                $('#isBulkTrue').prop('checked', false);
                $('#isBulkFalse').prop('checked', true);
            }

            $('#operator_issue_slot').val(operationData.issue_slot);
            //$('#operator_rot').val(operationData.rot);
            $('#operator_rot').val(JSON.stringify(operationData.rot, null, 2));
            $('#operator_scheduled_time').val(operationData.scheduled_time);
            $('#operator_shift_factor').val(operationData.shift_factor);
            return true;
        },
        onOperatorUnselect: function () {
            selectedComponent = null;
            $operatorProperties.hide();
            $('#delete_selected').prop('disabled', true);
            return true;
        },
        onOperatorMoved: function (operatorId, opData, destOpGrId) {
            if (operatorId.startsWith("Op_")) {
                //normal node is moved
                if (nodeMap[operatorId].opGroup != '') {
                    removeNodeFromParentList(operatorId);
                }

                if (destOpGrId != null) {
                    //add node to the new parent group
                    relationManager[destOpGrId.slice(0, -2)][destOpGrId.slice(-1)].childNode.push(operatorId);
                }

                updateNodeData(operatorId, opData);
            } else {
                //headNode is moved
                var groupUnitId = operatorId;
                var sub_num = 0;
                var newOpGroup = "";

                if (relationManager[groupUnitId][sub_num].parent != '') {
                    removeGroupUnitFromParentList(groupUnitId);
                }

                if (destOpGrId != null) {
                    newOpGroup = destOpGrId;
                    //add groupUnit to the new parent group
                    relationManager[destOpGrId.slice(0, -2)][destOpGrId.slice(-1)].childGroup.push(groupUnitId);
                }

                //update headNode here since it is not stored in the nodeMap
                var newHeadNode = $.extend(true, {}, opData);
                if (newHeadNode.hasOwnProperty("internal")) {
                    delete newHeadNode.internal;
                }
                relationManager[groupUnitId][sub_num].parent = newOpGroup;
                relationManager[groupUnitId][sub_num].headNode = newHeadNode;
                sub_num++;
                relationManager[groupUnitId][sub_num].parent = newOpGroup;
                relationManager[groupUnitId][sub_num].headNode = newHeadNode;
            }
        },
        onOperatorDelete: function (operatorId) {
            return true;
        },
    });

    /*
    $operatorTitle.keyup(function () {
        var selectedOperatorId = $flowchart.flowchart('getSelectedOperatorId');
        if (selectedOperatorId != null) {
            $flowchart.flowchart('setOperatorTitle', selectedOperatorId, $operatorTitle.val());
        }
    });
    */

    $('#setOperatorInfos').click(function () {
        var operatorId = $operatorTitle.val();
        var operationData = null;
        if (operatorId in relationManager) {
            operationData = relationManager[operatorId];
        } else if (operatorId in nodeMap) {
            operationData = nodeMap[operatorId];
        }

        if (operationData != null) {
            var radioName = document.getElementsByName('flexRadioDontTouch');
            if (radioName[0].checked) {
                operationData.dont_touch = true;
            } else {
                operationData.dont_touch = false;
            }

            radioName = document.getElementsByName('flexRadioExpandLoop');
            if (radioName[0].checked) {
                operationData.expand_loop = true;
            } else {
                operationData.expand_loop = false;
            }

            radioName = document.getElementsByName('flexRadioIgnoreChildren');
            if (radioName[0].checked) {
                operationData.ignore_children = true;
            } else {
                operationData.ignore_children = false;
            }

            radioName = document.getElementsByName('flexRadioIsBulk');
            if (radioName[0].checked) {
                operationData.is_bulk = true;
            } else {
                operationData.is_bulk = false;
            }

            operationData.issue_slot = $('#operator_issue_slot').val();
            operationData.rot = $('#operator_rot').val().json();
            operationData.scheduled_time = Number($('#operator_scheduled_time').val());
            operationData.shift_factor = Number($('#operator_shift_factor').val());
            /*
            console.log(typeof operationData.is_bulk);
            console.log(typeof operationData.issue_slot);
            console.log(typeof operationData.rot);
            console.log(typeof operationData.scheduled_time);
            console.log(typeof operationData.shift_factor);
            */
            alert("Operator properties are saved.");
        }
    });

    //--- end
    //--- operator and link properties
    //-----------------------------------------



    //-----------------------------------------
    //--- link properties
    //--- start
    $flowchart.flowchart({
        onLinkCreate: function (linkId, linkData) {
            if (linkId.startsWith("Op_") && !(linkId in dependencyManager)) {
                var constraintData = $.extend(true, {}, linkData);
                createConstraint(linkId, constraintData);
            }
            return true;
        },
        onLinkDelete: function (linkId, forced) {
            if (linkId in dependencyManager) {
                deleteConstraint(linkId);
            }
            return true;
        },
        onLinkSelect: function (linkId) {
            $opGroupProperties.hide();

            if (linkId.startsWith("Op_")) {
                $('#delete_selected').prop('disabled', false);

                selectedComponent = { id: linkId, type: "link" };

                $linkPropertiesStatic.show();
                $linkPropertiesAdvanced.show()
                var linkInfos = $flowchart.flowchart('getLinkInfos', linkId);
                $linkTitle.val(linkId);
                $linkColor.val(linkInfos[0]);
                $linkFrom.val(linkInfos[1]);
                $linkTo.val(linkInfos[2]);

                $('#flexRadioPosINF0').prop('checked', false);
                //$('#flexRadioNegINF0').prop('checked', false);
                $('#flexRadioNumber0').prop('checked', false);
                $('#flexRadioPosINF1').prop('checked', false);
                //$('#flexRadioNegINF1').prop('checked', false);
                $('#flexRadioNumber1').prop('checked', false);
                $('#ConstraintInput0').val(0);
                $('#ConstraintInput1').val(0);
                $('#ConstraintInput0').hide();
                $('#ConstraintInput1').hide();

                if (linkInfos[3] == "+INF") {
                    $('#flexRadioPosINF0').prop('checked', true);
                /*} else if (linkInfos[3] == "-INF") {
                    $('#flexRadioNegINF0').prop('checked', true);*/
                } else {
                    $('#flexRadioNumber0').prop('checked', true);
                    $('#ConstraintInput0').val(linkInfos[3]);
                    $('#ConstraintInput0').show();
                }

                if (linkInfos[4] == "+INF") {
                    $('#flexRadioPosINF1').prop('checked', true);
                /*} else if (linkInfos[4] == "-INF") {
                    $('#flexRadioNegINF1').prop('checked', true);*/
                } else {
                    $('#flexRadioNumber1').prop('checked', true);
                    $('#ConstraintInput1').val(linkInfos[4]);
                    $('#ConstraintInput1').show();
                }
            } else {
                $linkPropertiesStatic.show();
                var linkInfos = $flowchart.flowchart('getLinkInfos', linkId);
                $linkTitle.val(linkId);
                $linkColor.val(linkInfos[0]);
                $linkFrom.val(linkInfos[1]);
                $linkTo.val(linkInfos[2]);
                $('#delete_selected').prop('disabled', true);
            }

            return true;
        },
        onLinkUnselect: function () {
            selectedComponent = null;
            $linkPropertiesAdvanced.hide();
            $linkPropertiesStatic.hide();
            $('#delete_selected').prop('disabled', true);
            return true;
        },
    });

    $linkColor.change(function () {
        var selectedLinkId = $flowchart.flowchart('getSelectedLinkId');
        if (selectedLinkId != null) {
            $flowchart.flowchart('setLinkMainColor', selectedLinkId, $linkColor.val());
        }
    });

    $('#setLinkConstraint').click(function () {
        var linkId = $linkTitle.val();
        if (!(linkId in dependencyManager)) {
            alert("Unknown link: " + linkId);
            return;
        }

        var constraintType0Radio = document.getElementsByName('flexRadioConstraint0');
        var constraintType1Radio = document.getElementsByName('flexRadioConstraint1');
        var constraintInput0 = document.getElementById('ConstraintInput0').value;
        var constraintInput1 = document.getElementById('ConstraintInput1').value;

        var constraintType0 = "";
        var constraintType1 = "";

        for (let i = 0; i < constraintType0Radio.length; i++) {
            if (constraintType0Radio[i].checked) {
                constraintType0 = constraintType0Radio[i].getAttribute("value");
            }
        }

        for (let i = 0; i < constraintType1Radio.length; i++) {
            if (constraintType1Radio[i].checked) {
                constraintType1 = constraintType1Radio[i].getAttribute("value");
            }
        }

        if (constraintType0 != "Number") {
            constraintInput0 = constraintType0;
        }

        if (constraintType1 != "Number") {
            constraintInput1 = constraintType1;
        }

        $flowchart.flowchart('setLinkConstraint', linkId, constraintInput0, constraintInput1);
        var constraintData = dependencyManager[linkId];
        constraintData.constraint0 = constraintInput0;
        constraintData.constraint1 = constraintInput1;
    });
    //--- end
    //--- link properties
    //-----------------------------------------


    //-----------------------------------------
    //--- opGroup properties
    //--- start

    var $opGroupProperties = $('#opGroup_properties');
    $opGroupProperties.hide();

    var $opGroupTitle = $('#opGroup_title');
    var $subGroup = document.getElementById('showSubgroupOptions');
    var $opGroupParent = document.getElementById('showParentGroupOptions');
    var $parentSubGroup = document.getElementById('showParentSubgroupOptions');

    $flowchart.flowchart({
        onOpGroupSelect: function (opGroupId) {
            selectedComponent = { id: opGroupId, type: "opGroup" };
            $opGroupProperties.show();
            var infos = $flowchart.flowchart('getOpGroupInfos', opGroupId);
            var parentTitle = infos.parent.slice(0, -2);
            for (i = 0; i < $opGroupParent.length; i++) {
                if ($opGroupParent.options[i].text == parentTitle) {
                    $opGroupParent.selectedIndex = $opGroupParent.options[i].value;
                    break;
                }
            }
            $parentSubGroup.selectedIndex = Number(infos.parent.slice(-1));
            $opGroupTitle.val(infos.title.slice(0, -2));
            $subGroup.selectedIndex = Number(infos.title.slice(-1));
            return true;
        },
        onOpGroupUnselect: function () {
            selectedComponent = null;
            $opGroupProperties.hide();
            clearOpGroupInfos();
            return true;
        },
        onOpGroupDelete: function (opGroupId) {
            deleteOpGroupData(opGroupId);
            return true;
        },
    });

    $('#create_opGroup').click(function () {
        if ($opGroupProperties.is(":hidden")) {
            $opGroupProperties.show();
            $operatorProperties.hide();
            $linkPropertiesStatic.hide();
            $linkPropertiesAdvanced.hide();
        } else {
            $opGroupProperties.hide();
        }
    });

    $('#setOpGroupInfos').click(function () {
        var groupUnitId = $opGroupTitle.val();
        var sub_num = $subGroup.options[$subGroup.selectedIndex].text;
        var parentGroup = $opGroupParent.options[$opGroupParent.selectedIndex].text;
        var parentSub_num = $parentSubGroup.options[$parentSubGroup.selectedIndex].text;

        if (groupUnitId.length < 1) {
            alert("Please provide a valid name!");
            return;
        }

        createOpGroup(groupUnitId, sub_num, parentGroup, parentSub_num);
        loadGroupUnitOptions();
        clearOpGroupInfos();
    });

    /**
     * 
     * @param {any} groupUnitId
     * @param {any} sub_num
     * @param {any} parentGroup
     * @param {any} parentSub_num
     */
    function createOpGroup(groupUnitId, sub_num, parentGroup, parentSub_num) {
        //"Op_xxxx" is reserved for node, cannot be used as group name
        if (groupUnitId.startsWith("Op_")) {
            alert("Group name is not allowed to start with 'Op_'!");
            return;
        }

        var groupUnit = null;

        //Check if subGroup is already created. 
        if (groupUnitId in relationManager) {
            groupUnit = relationManager[groupUnitId];
            if (groupUnit[sub_num].isPainted) {
                alert(groupUnitId + "_" + sub_num + " exist!");
                return;
            }
        } else if (groupUnitId != "ROOT" && !relationManager[parentGroup][parentSub_num].isPainted) {//check if parent exists
            alert("Invalid parent group " + parentGroup + "_" + parentSub_num + " !");
            return;
        } else {//Note: GroupX_1's parent group is set here when GroupX_0 is created
            createGroupUnitData(groupUnitId, parentGroup + "_" + parentSub_num);
            if (groupUnitId != "ROOT") {
                relationManager[parentGroup][parentSub_num].childGroup.push(groupUnitId);
            }
        }

        relationManager[groupUnitId][sub_num].isPainted = true;
        var opGroupData = relationManager[groupUnitId][sub_num];
        $flowchart.flowchart('createOpGroup', opGroupData.title, opGroupData);

        loadGroupUnitOptions();
    }

    function restoreOpGroup(groupUnitId, sub_num, opGroupData) {
        if (groupUnitId == 'ROOT' && sub_num == '0') {
            $flowchart.flowchart('updateOpGroupGeometric', opGroupData.title, opGroupData);
        } else {
            if (opGroupData == null) {
                opGroupData = relationManager[groupUnitId][sub_num];
            }
            $flowchart.flowchart('createOpGroup', opGroupData.title, opGroupData, true);
        }
        loadGroupUnitOptions();
    }


    /**
     * 
     * @param {any} 
     */
    function clearOpGroupInfos() {
        $opGroupTitle.val('');
        $subGroup.selectedIndex = 0;
        $opGroupParent.selectedIndex = 0;
        $parentSubGroup.selectedIndex = 0;
    }
    //--- end
    //--- opGroup properties
    //-----------------------------------------


    //-----------------------------------------
    //--- delete operator / link / group button
    //--- start
    $('#delete_selected').click(function () {
        $flowchart.flowchart('deleteSelected');
    });
    //--- end
    //--- delete operator / link / group button
    //-----------------------------------------
    /**
     * 
     * @param {any} 
     */
    function formatConstraintsForJSON() {
        var constraints = {};
        var keyArray = Object.keys(dependencyManager);

        for (let i = 0; i < keyArray.length; i++) {
            var constraintData = dependencyManager[keyArray[i]];
            constraints[keyArray[i]] = {
                d_hi: constraintData.constraint0,
                d_lo: constraintData.constraint1,
                dest: constraintData.toOperator,
                dest_hook: 0,
                src: constraintData.fromOperator,
                src_hook: 0,
            };
        }
        return constraints;
    }
    /**
     * 
     * @param {any} 
     */
    function formatInstructionsForJSON() {
        var instructions = {};
        for (let r = 0; r < cellArray.length; r++) {
            for (let c = 0; c < cellArray[r].length; c++) {
                if (typeof cellArray[r][c] != "undefined") {
                    var cellName = r + "_" + c;
                    var arr = [];
                    for (let i = 0; i < cellArray[r][c].length; i++) {
                        var lineObj = cellArray[r][c][i];
                        arr.push(Number(lineObj.ID));
                    }
                    instructions[cellName] = arr;
                }
            }
        }

        return instructions;
    }
    /**
     * 
     * @param {any} 
     */
    function formatProgramLineForJSON() {
        var programList = [];
        var keyArray = Object.keys(programManager);
        for (let i = 0; i < keyArray.length; i++) {
            var pLine = programManager[keyArray[i]];
            if (pLine instanceof programLine) {
                var instructionInfo = {
                    id: pLine.getLineNum(),
                    immediate: pLine.getImmediate(),
                    name: pLine.getName(),
                    segment_values: pLine.getFullOptionsObject(),
                    segment_values_str: pLine.getSegmentValuesStr(),
                    timelabels: pLine.getTimelabels(),
                    timestamps: pLine.getTimestamps(),
                };
                programList.push(instructionInfo);
            }
        }
        return programList;
    }
    /**
     * 
     * @param {any} 
     */
    function formatOperationsForJSON() {
        var operations = {};
        var keyArray = Object.keys(relationManager);
        for (let i = 0; i < keyArray.length; i++) {
            var groupUnitId = keyArray[i];
            var groupUnitData = relationManager[groupUnitId];
            var childArr0 = groupUnitData["0"].childNode;
            let idx = 0;
            for (; idx < childArr0.length; idx++) {
                if (childArr0[idx] == (groupUnitId + '_0')) {
                    childArr0.splice(idx, 1);
                }
            }
            if (childArr0.length == 0) {
                childArr0 = null;
            }
            var childArr1 = groupUnitData["1"].childNode;
            for (idx = 0; idx < childArr1.length; idx++) {
                if (childArr1[idx] == (groupUnitId + '_1')) {
                    childArr1.splice(idx, 1);
                }
            }
            if (childArr1.length == 0) {
                childArr1 = null;
            }
            var operationInfo = {
                children0: childArr0,
                children1: childArr1,
                dont_touch: groupUnitData.dont_touch,
                expand_loop: groupUnitData.expand_loop,
                ignore_children: groupUnitData.ignore_children,
                is_bulk: groupUnitData.is_bulk,
                issue_slot: groupUnitData.issue_slot,
                name: groupUnitId,
                rot: groupUnitData.rot,
                scheduled_time: groupUnitData.scheduled_time,
                shift_factor: groupUnitData.shift_factor
            }
            operations[groupUnitId] = operationInfo;
        }

        keyArray = Object.keys(nodeMap);
        for (i = 0; i < keyArray.length; i++) {
            var nodeUnitId = keyArray[i];
            var nodeUnitData = nodeMap[nodeUnitId];
            var operationInfo = {
                children0: null,
                children1: null,
                dont_touch: nodeUnitData.dont_touch,
                expand_loop: nodeUnitData.expand_loop,
                ignore_children: nodeUnitData.ignore_children,
                is_bulk: nodeUnitData.is_bulk,
                issue_slot: nodeUnitData.issue_slot,
                name: nodeUnitId,
                rot: nodeUnitData.rot,
                scheduled_time: nodeUnitData.scheduled_time,
                shift_factor: nodeUnitData.shift_factor
            }
            operations[nodeUnitId] = operationInfo;
        }

        return operations;
    }

    //-----------------------------------------
    //--- save and load
    //--- start
    /**
     * 
     * @param {any} 
     */
    function generateJSON() {
        //var instructions = formatInstructionsForJSON();
        var data = {
            constraints: formatConstraintsForJSON(),
            entry: "ROOT",
            instr_lists: formatInstructionsForJSON(),
            isa: {
                instr_bitwidth: 27,
                instr_code_bitwidth: 4,
                instruction_list: formatProgramLineForJSON(),
                instruction_templates: isaData.instruction_templates,
            },
            operations: formatOperationsForJSON(),
            flowchart: $flowchart.flowchart('getData'),
        };
        var output = JSON.stringify(data, function (k, v) {
            if (v instanceof Array) {//keep array in one line except that it contains object
                for (let i = 0; i < v.length; i++) {
                    if (v[i] === Object(v[i])) {
                        return v;
                    }
                }
                return JSON.stringify(v);
            }
            return v;
        }, 2).replace(/\\/g, '')
            .replace(/\"\[/g, '[')
            .replace(/\]\"/g, ']')
            .replace(/\"\{/g, '{')
            .replace(/\}\"/g, '}');
        const downloadLink = document.querySelector("a.dynamic");
        downloadLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(output));
        downloadLink.setAttribute('download', 'descriptor_test.json');
    }
    $('#get_json').click(generateJSON);

    /**
     * 
     * @param {any} 
     */
    function Flow2Text() {
        var data = $flowchart.flowchart('getData');
        $('#flowchart_data').val(JSON.stringify(data, null, 2));
    }
    $('#get_data').click(Flow2Text);

    /**
     * 
     * @param {any} 
     */
    function Text2Flow() {
        var data = JSON.parse($('#flowchart_data').val());
        $flowchart.flowchart('setData', data);
    }
    $('#set_data').click(Text2Flow);

    /**
     * 
     * @param {any} 
     */
    /*global localStorage*/
    function SaveToLocalStorage() {
        if (typeof localStorage !== 'object') {
            alert('local storage not available');
            return;
        }
        Flow2Text();
        localStorage.setItem("stgLocalFlowChart", $('#flowchart_data').val());
    }
    $('#save_local').click(SaveToLocalStorage);

    /**
     * 
     * @param {any} 
     */
    function LoadFromLocalStorage() {
        if (typeof localStorage !== 'object') {
            alert('local storage not available');
            return;
        }
        var s = localStorage.getItem("stgLocalFlowChart");
        if (s != null) {
            $('#flowchart_data').val(s);
            Text2Flow();
        }
        else {
            alert('local storage empty');
        }
    }
    $('#load_local').click(LoadFromLocalStorage);
    //--- end
    //--- save and load
    //-----------------------------------------

    /**
     * 
     * @param {any} constraintArray
     */
    function addLinkToFlowchartData(constraintArray) {
        for (let count = 0; count < constraintArray.length; count++) {
            var newLinkId = constraintArray[count];
            var newLinkData = dependencyManager[newLinkId];
            $('#flowchartworkspace').flowchart('createLink', newLinkId, newLinkData);
        }
    }
    /**
     * 
     * @param {any} nodeArray
     */
    function addOperatorToFlowchartData(nodeArray) {
        for (let count = 0; count < nodeArray.length; count++) {
            var newOperatorData = nodeMap[nodeArray[count]];

            $('#flowchartworkspace').flowchart('createOperator', newOperatorData.properties.title, newOperatorData, false);
        }
    }
    /**
     * 
     * @param {any} nodeArray
     */
    function deleteOperatorFromFlowchart(nodeArray) {
        //user case: new link on a node
        for (let count = 0; count < nodeArray.length; count++) {
            $('#flowchartworkspace').flowchart('deleteOperator', nodeArray[count]);
        }
    }
    /*************************Test program. Use random number generator to select the index of instruction**************************/

    /**
     * 
     * @param {any} length
     */
    function generateRandomProgram(length) {
        for (var count = 0; count < length; count++) {
            var index = Math.floor(Math.random() * Object.keys(instructionMap).length) + 1;
            var cellPos = Math.floor(Math.random() * 2) + "," + Math.floor(Math.random() * 3);
            document.getElementById("editableFields").innerHTML = "";

            prepareEditableFields(true, instructionMap[index], null, cellPos);
            completeInput();
            insertUserInput();
        }
    }

    $('#buttonRunTest').click(function () {
        var programLength = 5;
        generateRandomProgram(programLength);
    });

    $('#buttonRunTest').dblclick(function () {
        if (confirm('Delete all program?')) {
            refreshHomepage(false);
        }
    });
    /************************************************End**********************************************************/

});
