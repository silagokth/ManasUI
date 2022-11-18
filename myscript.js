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
    var cellArray;
    let cellString = "";//"r,c"

    //RELATION section
    //const relationObj = {};
    const phaseObj = {};//{'HALT' : num, 'REFI': num, 'DPU' : num, ...}

    //a potential programLine class
    class programLine {
        constructor() {
            this.segmentOptionObject = {};
            this.isValid = false;
        }

        createLineFromUserInput(userInputArg) {
            if (!this.id) this.id = instrID++;
            this.userInput = userInputArg;
            this.name = this.userInput.substring(0, this.userInput.indexOf(" "));
            this.phase = phaseObj[this.name];
            this.segmentOptStr = this.userInput.substring(this.userInput.indexOf(" ") + 1, this.userInput.length);
            var segmentOptionArray = this.segmentOptStr.split(', ');
            for (let count = 0; count < segmentOptionArray.length; count += 1) {
                var segmentPair = segmentOptionArray[count].split('=');
                this.segmentOptionObject[String(segmentPair[0])] = segmentPair[1];
            }
            //generate full line
            this.generateFullInstructionLine();
            this.generateFullOptionsObject();
        }

        setCellPosition(rowArg, colArg) {
            this.row = rowArg;
            this.column = colArg;
        }

        setWorkingLine(wlArg) {
            this.workingLine = wlArg;
        }

        setValid(val) {
            this.isvalid = val;
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

        getNodeArray() {
            let nodeArr = [];
            for (let count = 1; count < Number(this.phase) + 1; count++) {
                nodeArr.push("Op_" + getLineNumberString(this.getId()) + "_" + count);
            }
            return nodeArr;
        }

        generateFullInstructionLine() {
            var instructionList = isaData.instruction_templates;

            for (let i in instructionList) {
                if (instructionList[i].name == this.name) {
                    var segmentList = instructionList[i].segment_templates;
                    this.fullLine = instructionList[i].name;

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
            var instructionList = isaData.instruction_templates;

            for (let i in instructionList) {
                if (instructionList[i].name == this.name) {
                    var segmentList = instructionList[i].segment_templates;
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

    }


    //For testing purpose, a division to display the loaded json file
    const schemaDiv = $('#schema');

    $('#inputFiles').change(handleFileSelect);
    $('#cellUnitContainer').click(handleClickOnCellUnitContainer);

    function initCell() {
        cellArray = new Array(new Array(3), new Array(3));
    }

    function initRelation() {
        relationManager = {};
        createOpGroup("ROOT", "0", "ROOT", "0");
    }

    /* Load the selected file -> expected "isa.json" */
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

    function parseInputfile(filename, data) {
        if (filename.startsWith("isa")) {
            updateInstructionOptions(data);
        } else if (filename.startsWith("descriptor")) {
            restoreProgramFromJSON(data);
        }
    }

    function restoreProgramFromJSON(manasObj) {
        if ("isa" in manasObj) {
            updateInstructionOptions(manasObj.isa);
        }
    }

    /* update the global object and instrcution options */
    function updateInstructionOptions(isaObj) {
        isaData = isaObj;
        console.log(isaData);
        refreshHomepage(true);
    }

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

        schemaDiv.innerHTML = "";
    }

    function prepareInstructionInfo() {
        var instructionList = isaData.instruction_templates;
        var insCounter = 0;

        for (let i in instructionList) {
            insCounter += 1;
            instructionMap[insCounter] = instructionList[i].name;
            phaseObj[instructionList[i].name] = instructionList[i].phase;
        }
    }

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

    function prepareEditableFields(isNewInstruction, selectedInstr, segmentOptStr, cellPosition) {
        var instructionList = isaData.instruction_templates;
        var cellUnitField = document.getElementById("cellUnit");
        var instrInputField = document.getElementById("userInput");
        var editableFields = document.getElementById("editableFields");

        for (let i in instructionList) {
            if (instructionList[i].name == selectedInstr) {
                var segmentList = instructionList[i].segment_templates;
                var segmentOptionArray;
                var segmentOptionObject = {};
                var segmentCounter = 1;

                currentSelectedInstr = instructionList[i].name + " ";
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

    function clearInput() {
        var editableFields = document.getElementById("editableFields");
        var inputCollection = editableFields.querySelectorAll('.form-control');//get input value
        var counts = 0;

        for (; counts < inputCollection.length; counts += 1) {
            inputCollection[counts].value = "";
        }

    }

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
            var instructionList = isaData.instruction_templates;
            for (let i in instructionList) {
                if (instructionList[i].name == currentSelectedInstr.substring(0, currentSelectedInstr.length - 1)) {
                    if (Object.keys(instructionList[i].segment_templates).length > 0) {
                        alert("Empty input.");
                    }
                }
            }

        }
    }

    $('#buttonInsert').click(function () {
        insertUserInput();
    });

    /* append user input into programming area*/
    function insertUserInput() {
        var insertContent = document.getElementById("userInput").value;
        let pLine = new programLine();

        //validate the input
        if (insertContent == "") {
            return;
        }

        pLine.createLineFromUserInput(insertContent);
        pLine.setCellPosition(Number(cellString[0]), Number(cellString[2]));
        programManager[pLine.getId()] = pLine;
        appendNewLineToCellArray(pLine);
        appendNodeFromNewLine(pLine.getNodeArray());
        updateSpanWl(pLine.getId());
    }

    $('#buttonModify').click(function () {
        modifyUserSelect();
    });

    function modifyUserSelect() {
        var substituteContent = document.getElementById("userInput").value;
        let pLine = programManager[textareaWl];

        if (substituteContent == "")
            return;

        pLine.createLineFromUserInput(substituteContent);
        pLine.setCellPosition(Number(cellString[0]), Number(cellString[2]));

        if (confirm('Modify line: "' + getLineNumberString(pLine.getId()) + "  " + pLine.getUserInput() + '"?')) {
            programManager[pLine.getId()] = pLine;
            modifyLineFromCellArray(pLine);
        }
    }

    $('#buttonDelete').click(function () {
        deleteUserSelect();
    });
    
    function deleteUserSelect() {
        var instrInputField = document.getElementById("userInput");
        let pLine = programManager[textareaWl];

        if (instrInputField.value == "")
            return;

        if (pLine instanceof programLine) {
            if (confirm('Delete line: "' + getLineNumberString(pLine.getId()) + "  " + pLine.getUserInput() + '"?')) {
                deleteLineFromCellArray(pLine.getCellPosition(), pLine.getId());
                deleteNodeAlongWithProgramLine(pLine.getNodeArray());
                deleteConstraintAlongWithProgramLine(pLine.getNodeArray());
                delete programManager[textareaWl];
                instrInputField.value = "";
            }
        }
    }

    function updateSpanWl(newVal) {
        var spanWl = document.getElementById("workingLine");
        textareaWl = newVal;
        //console.log("Working on line: " + textareaWl);
        spanWl.innerText = getLineNumberString(textareaWl);
    }

    function getLineNumberString(number) {
        var addzero = "";

        if (number < 10) addzero = "000";
        else if (number < 100) addzero = "00";
        else if (number < 1000) addzero = "0";

        return (addzero + String(number));
    }

    /****************************************************CODE***********************************************************/
    function handleClickOnCellUnitContainer(evt) {
        evt = evt || window.event;
        var target = evt.target || evt.srcElement, text = target.textContent || target.innerText;

        updateSpanWl(Number(text.substring(0, 4)));
        loadselectedProgramLine(text);
    }

    function appendNewLineToCellArray(newLine) {
        var cellRow = newLine.getCellPosition()[0];
        var cellColumn = newLine.getCellPosition()[1];
        var lineObj = {};

        if (typeof cellArray[cellRow][cellColumn] == "undefined") {
            cellArray[cellRow][cellColumn] = new Array();
        }
        lineObj["ID"] = getLineNumberString(newLine.getId());
        lineObj["Content"] = newLine.getUserInput();
        cellArray[cellRow][cellColumn].push(lineObj);
        prepareCodeContentField();
    }

    function modifyLineFromCellArray(newLine) {
        var cellRow = newLine.getCellPosition()[0];
        var cellColumn = newLine.getCellPosition()[1];
        var newLineObj = {};

        if (typeof cellArray[cellRow][cellColumn] == "undefined") {
            return;
        }

        newLineObj["ID"] = getLineNumberString(newLine.getId());
        newLineObj["Content"] = newLine.getUserInput();

        for (count = 0; count < cellArray[cellRow][cellColumn].length; count++) {
            var lineObj = cellArray[cellRow][cellColumn][count];
            if (lineObj.ID == newLineObj.ID) {
                cellArray[cellRow][cellColumn][count] = newLineObj;
                break;
            }
        }
        prepareCodeContentField();
    }

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

    function updateOpGroupData(opGroupId, opGroupData) {
        var groupUnitId = opGroupId.slice(0, -2);
        relationManager[groupUnitId][opGroupId.slice(-1)] = opGroupData;
    }

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
            var parentSub_num = opGrData.parent.slice(-1);
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
                    var childGroupUnit = relationManager[groupArray[i]];
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

        var removeAll = false;
        if (sub_num == "0" && relationManager[groupUnitId]["1"].isPainted == false) {
            removeAll = true;
        } else if (sub_num == "1" && relationManager[groupUnitId]["0"].isPainted == false) {
            removeAll = true;
        }

        if (removeAll) {
            removeGroupUnitFromParentList(groupUnitId);
            delete relationManager[groupUnitId];
        }
    }

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

    function removeGroupUnitFromParentList(groupUnitId) {
        var sub_num = 0;
        var opGr = relationManager[groupUnitId][sub_num];
        var parentOpGr = relationManager[opGr.parent.slice(0, -2)][opGr.parent.slice(-1)];

        if (typeof parentOpGr == 'undefined') {
            alert("[removeGroupUnitFromParentList] Failed to find parent opGroup!");
            return;
        }
        for (i = 0; i < parentOpGr.childGroup.length; i++) {
            if (parentOpGr.childGroup[i] == groupUnitId) {
                parentOpGr.childGroup.splice(i, 1);
            }
        }
    }

    //-----------------------------------------
    //---------------NodeUnit------------------
    //-----------------------------------------
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

    function updateNodeData(nodeId, opData) {
        var nodeData = $.extend(true, {}, opData);
        if (nodeData.hasOwnProperty("internal")) {
            delete nodeData.internal;
        }
        nodeMap[nodeId] = nodeData;
    }

    function deleteNode(nodeId) {
        var nodeData = nodeMap[nodeId];
        if (typeof nodeData == 'undefined') {
            return;
        }

        removeNodeFromParentList(nodeId);
        delete nodeMap[nodeId];
    }
    
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
    

    function appendNodeFromNewLine(nodeArray) {
        for (let count = 0; count < nodeArray.length; count++) {
            createNode(nodeArray[count]);
            var sub_num = "0";
            relationManager["ROOT"][sub_num].childNode.push(nodeArray[count]);
        }

        addOperatorToFlowchartData(nodeArray);
        addConstriantForInnerNode(nodeArray);
    }

    function deleteNodeAlongWithProgramLine(nodeArray) {
        for (let i = 0; i < nodeArray.length; i++) {
            deleteNode(nodeArray[i]);
        }

        deleteOperatorFromFlowchart(nodeArray);
    }

    /*************************************************DEPENDENCY********************************************************/
    var dependencyManager = {};

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

    function createConstraint(constraintId, constraintData) {
        dependencyManager[constraintId] = constraintData;
    }

    function updateConstraint(constraintId, constraintData) {
        if (constraintId in dependencyManager) {
            dependencyManager[constraintId] = constraintData;
        }
    }

    function deleteConstraint(constraintId) {
        delete dependencyManager[constraintId];
    }
    
    function addConstriantForInnerNode(nodeArray) {
        if (nodeArray.length < 2) {
            return;
        }
        var newConstraintArray = [];

        for (let count = 0; count < nodeArray.length - 1; count++) {
            var constraintId = nodeArray[count] + "_" + nodeArray[count + 1];
            var constraintData = createConstraintData(nodeArray[count], nodeArray[count + 1], "0", "0");
            createConstraint(constraintId, constraintData);
            newConstraintArray.push(constraintId);

        }
        addLinkToFlowchartData(newConstraintArray);
    }

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
        links: {}
    };

    var $flowchart = $('#flowchartworkspace');

    // Apply the plugin on a standard, empty div...
    $flowchart.flowchart({
        data: defaultFlowchartData,
        defaultSelectedLinkColor: '#3366ff',
        linkWidth: 2,
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
            if (!(operatorId.startsWith("Op_") || operatorId in relationManager)) {
                $operatorProperties.hide();
                return true;
            }
            
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
            console.log(operationData);
            
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
            $('#operator_rot').val(operationData.rot);
            $('#operator_scheduled_time').val(operationData.scheduled_time);
            $('#operator_shift_factor').val(operationData.shift_factor);
            return true;
        },
        onOperatorUnselect: function () {
            $operatorProperties.hide();
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
            if (operatorId.startsWith("Op_")) {
                deleteNode(operatorId);
            }
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
            operationData.rot = $('#operator_rot').val();
            operationData.scheduled_time = Number($('#operator_scheduled_time').val());
            operationData.shift_factor = Number($('#operator_shift_factor').val());

            console.log(typeof operationData.is_bulk);
            console.log(typeof operationData.issue_slot);
            console.log(typeof operationData.rot);
            console.log(typeof operationData.scheduled_time);
            console.log(typeof operationData.shift_factor);

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
                $linkPropertiesStatic.show();
                $linkPropertiesAdvanced.show()
                var linkInfos = $flowchart.flowchart('getLinkInfos', linkId);
                $linkTitle.val(linkId);
                $linkColor.val(linkInfos[0]);
                $linkFrom.val(linkInfos[1]);
                $linkTo.val(linkInfos[2]);

                $('#flexRadioPosINF0').prop('checked', false);
                $('#flexRadioNegINF0').prop('checked', false);
                $('#flexRadioNumber0').prop('checked', false);
                $('#flexRadioPosINF1').prop('checked', false);
                $('#flexRadioNegINF1').prop('checked', false);
                $('#flexRadioNumber1').prop('checked', false);
                $('#ConstraintInput0').val(0);
                $('#ConstraintInput1').val(0);
                $('#ConstraintInput0').hide();
                $('#ConstraintInput1').hide();

                if (linkInfos[3] == "+INF") {
                    $('#flexRadioPosINF0').prop('checked', true);
                } else if (linkInfos[3] == "-INF") {
                    $('#flexRadioNegINF0').prop('checked', true);
                } else {
                    $('#flexRadioNumber0').prop('checked', true);
                    $('#ConstraintInput0').val(linkInfos[3]);
                    $('#ConstraintInput0').show();
                }

                if (linkInfos[4] == "+INF") {
                    $('#flexRadioPosINF1').prop('checked', true);
                } else if (linkInfos[4] == "-INF") {
                    $('#flexRadioNegINF1').prop('checked', true);
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
            }

            return true;
        },
        onLinkUnselect: function () {
            $linkPropertiesAdvanced.hide();
            $linkPropertiesStatic.hide();
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
    $flowchart.flowchart({
        onOpGroupSelect: function (opGroupId) {
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
            $opGroupProperties.hide();
            clearOpGroupInfos();
            return true;
        },
        onOpGroupDelete: function (opGroupId) {
            deleteOpGroupData(opGroupId);
            return true;
        },
    });

    var $opGroupProperties = $('#opGroup_properties');
    $opGroupProperties.hide();

    var $opGroupTitle = $('#opGroup_title');
    var $subGroup = document.getElementById('showSubgroupOptions');
    var $opGroupParent = document.getElementById('showParentGroupOptions');
    var $parentSubGroup = document.getElementById('showParentSubgroupOptions');

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
        } else {//GroupX_1's parent group is set here when GroupX_0 is created
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

    function formatConstraintsForJSON() {
        var constraints = {};
        var keyArray = Object.keys(dependencyManager);

        for (let i = 0; i < keyArray.length; i++) {
            var constraintData = dependencyManager[keyArray[i]];
            constraints[keyArray[i]] = {
                d_hi: constraintData.constraint0,
                d_lo: constraintData.constraint1,
                dest: constraintData.fromOperator,
                dest_hook: 0,
                src: constraintData.toOperator,
                src_hook: 0,
            };
        }
        return constraints;
    }

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

    function formatProgramLineForJSON() {
        var programList = [];
        var keyArray = Object.keys(programManager);
        for (let i = 0; i < keyArray.length; i++) {
            var pLine = programManager[keyArray[i]];
            if (pLine instanceof programLine) {
                var instructionInfo = {
                    id: pLine.getId(),
                    immediate: 0,
                    name: pLine.getName(),
                    segment_values: pLine.getFullOptionsObject(),
                    segment_values_str: null,
                    timelabels: [[4, ""], [3, ""], [2, ""], [1, ""], [0, ""]],
                    timestamps: [[4, -1], [3, -1], [2, -1], [1, -1], [0, -1]],
                };
                programList.push(instructionInfo);
            }
        }
        return programList;
    }

    function formatOperationsForJSON() {
        var operations = {};
        var keyArray = Object.keys(relationManager);
        for (let i = 0; i < keyArray.length; i++) {
            var groupUnitId = keyArray[i];
            var groupUnitData = relationManager[groupUnitId];
            var childArr0 = groupUnitData["0"].childGroup.concat(groupUnitData["0"].childNode);
            if (childArr0.length == 0) {
                childArr0 = null;
            }
            var childArr1 = groupUnitData["1"].childGroup.concat(groupUnitData["1"].childNode);
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
        $('#flowchart_data').val(JSON.stringify(data, function (k, v) {
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
            .replace(/\}\"/g, '}'));

        const downloadLink = document.querySelector("a.dynamic");
        downloadLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent($('#flowchart_data').val()));
        downloadLink.setAttribute('download', 'descriptor_test.json')

    }
    $('#get_json').click(generateJSON);

    function Flow2Text() {
        var data = $flowchart.flowchart('getData');
        $('#flowchart_data').val(JSON.stringify(data, null, 2));
    }
    $('#get_data').click(Flow2Text);

    function Text2Flow() {
        var data = JSON.parse($('#flowchart_data').val());
        $flowchart.flowchart('setData', data);
    }
    $('#set_data').click(Text2Flow);

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

    function addLinkToFlowchartData(constraintArray) {
        for (let count = 0; count < constraintArray.length; count++) {
            var newLinkId = constraintArray[count];
            var newLinkData = dependencyManager[newLinkId];
            $('#flowchartworkspace').flowchart('createLink', newLinkId, newLinkData);
        }
    }

    function addOperatorToFlowchartData(nodeArray) {
        for (let count = 0; count < nodeArray.length; count++) {
            var newOperatorData = nodeMap[nodeArray[count]];

            $('#flowchartworkspace').flowchart('createOperator', newOperatorData.properties.title, newOperatorData);
        }
    }

    function deleteOperatorFromFlowchart(nodeArray) {
        //user case: new link on a node
        for (let count = 0; count < nodeArray.length; count++) {
            $('#flowchartworkspace').flowchart('deleteOperator', nodeArray[count]);
        }
    }
    /*************************Test program. Use random number generator to select the index of instruction**************************/
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

    //function handleRunTestProgram()
    $('#buttonRunTest').click(function () {
        var programLength = 5;
        generateRandomProgram(programLength);
    });

    //function clearTestProgram()
    $('#buttonRunTest').dblclick(function () {
        if (confirm('Delete all program?')) {
            refreshHomepage(false);
        }
    });
    /************************************************End**********************************************************/

});

/*For testing purpose, to check if load correct json file (isa_v1.json) by displaying its content*/
/*
function showInstruction() {
    var jsonObj = jsonSchema;
    var pPlatform = document.createElement('p');
    var pInstrBitwidth = document.createElement('p');
    var pInstrCodeBitwidth = document.createElement('p');
    var pBlockStartL1 = document.createElement('p');
    var pBlockEndL1 = document.createElement('p');
    var instructionList;


    pPlatform.innerHTML = "<pre>  &quot;platform&quot;: " + jsonObj.platform + "</pre>";
    pInstrBitwidth.innerHTML = "<pre>  &quot;instr_bitwidth&quot;: " + jsonObj.instr_bitwidth + "</pre>";
    pInstrCodeBitwidth.innerHTML = "<pre>  &quot;instr_code_bitwidth&quot;: " + jsonObj.instr_code_bitwidth + "</pre>";
    pBlockStartL1.innerHTML = "<span><br/>{</span>";

    schemaDiv.appendChild(pBlockStartL1);
    schemaDiv.appendChild(pPlatform);
    schemaDiv.appendChild(pInstrBitwidth);
    schemaDiv.appendChild(pInstrCodeBitwidth);
    instructionList = jsonObj.instruction_templates;

    //console.log(typeof instructionList);

    for (let i in instructionList) {
        var pBlockStartL2 = document.createElement('p');
        var pBlockEndL2 = document.createElement('p');
        var pInsCode = document.createElement('p');
        var pInsName = document.createElement('p');
        var pInsPhase = document.createElement('p');
        var pInsMaxChunk = document.createElement('p');
        var divInstructionItem = document.createElement('div');
        var segmentList;

        //console.log("ins: " + i);
        pBlockStartL2.innerHTML = "<pre><span>  [</span></pre>";
        pInsCode.innerHTML = "<pre>    &quot;code&quot;: " + instructionList[i].code + "</pre>";
        pInsName.innerHTML = "<pre>    &quot;name&quot;: " + instructionList[i].name + "</pre>";
        pInsPhase.innerHTML = "<pre>    &quot;phase&quot;: " + instructionList[i].phase + "</pre>";
        pInsMaxChunk.innerHTML = "<pre>    &quot;max_chunk&quot;: " + instructionList[i].max_chunk + "</pre>";

        divInstructionItem.appendChild(pBlockStartL2);
        divInstructionItem.appendChild(pInsCode);
        divInstructionItem.appendChild(pInsName);
        divInstructionItem.appendChild(pInsPhase);
        divInstructionItem.appendChild(pInsMaxChunk);

        segmentList = instructionList[i].segment_templates;

        for (let j in segmentList) {
            var pBlockStartL3 = document.createElement('p');
            var pBlockEndL3 = document.createElement('p');
            var pSegId = document.createElement('p');
            var pSegName = document.createElement('p');
            var pSegBitwidth = document.createElement('p');
            var divSegmentItem = document.createElement('div');

            //console.log("seg: " + j);
            pBlockStartL3.innerHTML = "<pre><span>    {</span></pre>";
            pSegId.innerHTML = "<pre>      &quot;id&quot;: " + segmentList[j].id + "</pre>";
            pSegName.innerHTML = "<pre>      &quot;name&quot;: " + segmentList[j].name + "</pre>";
            pSegBitwidth.innerHTML = "<pre>      &quot;bitwidth&quot;: " + segmentList[j].bitwidth + "</pre>";

            divSegmentItem.appendChild(pBlockStartL3);
            divSegmentItem.appendChild(pSegId);
            divSegmentItem.appendChild(pSegName);
            divSegmentItem.appendChild(pSegBitwidth);

            pBlockEndL3.innerHTML = "<pre><span>    }</span></pre>";
            divSegmentItem.appendChild(pBlockEndL3);
            divInstructionItem.appendChild(divSegmentItem);
        }
        pBlockEndL2.innerHTML = "<pre><span>  ]</span></pre>";
        divInstructionItem.appendChild(pBlockEndL2)
        schemaDiv.appendChild(divInstructionItem);
    }
    pBlockEndL1.innerHTML = "<span>}</span>";
    schemaDiv.appendChild(pBlockEndL1);
}
*/
