/*
In this version(v0.0.0_beta), program lines are organized and displayed in order.
(perhaps describing some functionality here...)
However, a unordered list might be more appropriated to organize program lines because they don't need to be in order.
Thus, we don't need to calculate position for each line in textarea.
*/

            //Store the json content as an object
            var jsonSchema = {};
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
            const relationObj = {};
            const phaseObj = {};//{'HALT' : num, 'REFI': num, 'DPU' : num, ...}
            //DEPENDENCY section

            //a potential programLine class 
            class programLine {
                constructor() {
                    this.segmentOptionObject = {};
                    this.isValid = false;
                }

                createLineFromUserInput(userInputArg) {
                    if(!this.id) this.id = instrID++;
                    this.userInput = userInputArg;
                    this.name = this.userInput.substring(0, this.userInput.indexOf(" "));
                    this.phase = phaseObj[this.name];
                    this.segmentOptStr = this.userInput.substring(this.userInput.indexOf(" ") + 1, this.userInput.length);
                    var segmentOptionArray = this.segmentOptStr.split(', ');
                    for (var counter = 0; counter < segmentOptionArray.length; counter += 1) {
                        var segmentPair = segmentOptionArray[counter].split('=');
                        this.segmentOptionObject[String(segmentPair[0])] = segmentPair[1];
                    }
                    //generate full line
                    this.generateFullInstructionLine();
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

                generateFullInstructionLine() {
                    var instructionList = jsonSchema.instruction_templates;

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

            }


            //For testing purpose, a division to display the loaded json file
            const schemaDiv = document.getElementById('schema');

            document.getElementById('inputFiles').addEventListener('change', handleFileSelect, false);
            document.getElementById('cellUnitContainer').addEventListener('click', handleClickOnCellUnitContainer);

            function initCell() {
                cellArray = new Array(new Array(3), new Array(3));
            }

            function initObjects() {
                relationObj.ROOT = {};
                relationObj.ROOT.child0 = [];
                relationObj.ROOT.child1 = [];
            }

            /* Load the selected file -> expected "isa.json" */
            function handleFileSelect(evt) {
                var files = evt.target.files; // FileList object

                // Loop through the FileList
                for (let i = 0, f; f = files[i]; i++) {

                    var reader = new FileReader();

                    reader.onload = (function (theFile) {
                        return function (e) {

                            fetch(e.target.result)
                                .then(res => res.json()) // the .json() method parses the JSON response into a JS object literal
                                .then(data => updateInstructionOptions(data));
                        }
                    })(f);

                    reader.readAsDataURL(f);
                }
            }

            /* update the global object and instrcution options */
            function updateInstructionOptions(jsonObj) {
                jsonSchema = jsonObj;
                clearContent();
                initObjects();
                initCell();
                prepareInstructionInfo();
                loadInstrOptions();

                //showInstruction();
            }

            /* Remove current content before appending the new one */
            function clearContent() {
                var instrOptionsSelect = document.getElementById('showInstrOptions');
                var optionInstruction = document.createElement('option');

                optionInstruction.selected = true;
                optionInstruction.innerText = "Instruction Set";
                instrOptionsSelect.innerHTML = "";
                instrOptionsSelect.appendChild(optionInstruction);

                schemaDiv.innerHTML = "";
            }

            function prepareInstructionInfo(){
                var instructionList = jsonSchema.instruction_templates;
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
                var insCounter = 0;
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
                var instructionList = jsonSchema.instruction_templates;
                var cellUnitField = document.getElementById("cellUnit");
                var instrInputField = document.getElementById("userInput");
                var editableFields = document.getElementById("editableFields");

                for (let i in instructionList) {
                    if (instructionList[i].name == selectedInstr) {
                        var segmentList = instructionList[i].segment_templates;
                        var segmentOptionArray;
                        var segmentOptionObject = {};
                        var segmentCounter = 0;

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
                                    <label class="input-group-text">Row</label>
                                </div>
                                <select class="custom-select" title="row">
                                    <option value="0">0</option>
                                    <option value="1">1</option>
                                </select>
                                <div class="input-group-prepend">
                                    <label class="input-group-text">Column</label>
                                </div>
                                <select class="custom-select" title="column">
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

                        for(var count = 0; count < 2; count++) {
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
                        buttonCompleteInput.setAttribute('onclick', 'completeInput()');

                        buttonClearInput.innerText = "Clear";
                        buttonClearInput.className = "btn btn-secondary btn-sm";
                        buttonClearInput.type = "button";
                        buttonClearInput.setAttribute('onclick', 'clearInput()');
                        buttonClearInput.style.margin = "0 0 0 5px";

                        editableFields.appendChild(buttonCompleteInput);
                        editableFields.appendChild(buttonClearInput);
                        document.getElementById("buttonEdit").innerHTML = "EDIT(" + segmentCounter + ")";
                        break;
                    }
                }
            }

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
                    var instructionList = jsonSchema.instruction_templates;
                    for (let i in instructionList) {
                        if (instructionList[i].name == currentSelectedInstr.substring(0, currentSelectedInstr.length - 1)) {
                            if (Object.keys(instructionList[i].segment_templates).length > 0) {
                                alert("Empty input.");
                            }
                        }
                    }
                    
                }
            }

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
                updateSpanWl(pLine.getId());
            }

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

            function deleteUserSelect() {
                var instrInputField = document.getElementById("userInput");
                let pLine = programManager[textareaWl];

                if (instrInputField.value == "")
                    return;

                if (pLine instanceof programLine) {
                    if (confirm('Delete line: "' + getLineNumberString(pLine.getId()) + "  " + pLine.getUserInput() + '"?')) {
                        deleteLineFromCellArray(pLine.getCellPosition(), pLine.getId());
                        delete programManager[textareaWl];
                        instrInputField.value = "";
                    }
                }
            }

            function updateSpanWl(newVal) {
                var spanWl = document.getElementById("workingLine");
                textareaWl = newVal;
                console.log("Working on line: " + textareaWl);
                spanWl.innerText = getLineNumberString(textareaWl);
            }

            function getLineNumberString(number){
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
            function loadGroupUnitOptions() {
                var groupOptionsSelect = document.getElementById('showGroupOptions');
                var srcGroupOptionsSelect = document.getElementById('showSourceGroupOptions');
                var destGroupOptionsSelect = document.getElementById('showDestGroupOptions');
                var parentGroupOptionsSelect = document.getElementById('showParentGroupOptions');
                var insCounter = 0;
                var keyArray = Object.keys(relationObj);

                groupOptionsSelect.innerHTML = "";
                srcGroupOptionsSelect.innerHTML = "";
                destGroupOptionsSelect.innerHTML = "";
                if (keyArray.length > 0) {
                    for (let i = 0; i < keyArray.length; i++) {
                        var optionGroupUnit = document.createElement('option');
                        var optionSrcGroupUnit = document.createElement('option');
                        var optionDestGroupUnit = document.createElement('option');
                        var optionParentGroupUnit = document.createElement('option');

                        optionGroupUnit.value = i;
                        optionGroupUnit.innerHTML = keyArray[i];
                        optionSrcGroupUnit.value = i;
                        optionSrcGroupUnit.innerHTML = keyArray[i];
                        optionDestGroupUnit.value = i;
                        optionDestGroupUnit.innerHTML = keyArray[i];
                        optionParentGroupUnit.value = i;
                        optionParentGroupUnit.innerHTML = keyArray[i];

                        groupOptionsSelect.appendChild(optionGroupUnit);
                        srcGroupOptionsSelect.appendChild(optionSrcGroupUnit);
                        destGroupOptionsSelect.appendChild(optionDestGroupUnit);
                        parentGroupOptionsSelect.appendChild(optionParentGroupUnit);
                    }
                }
                else {
                    return;
                }
            }

            function addGroupUnit() {
                var addTab = document.getElementById("v-pills-add");
                var newGroupUnit = addTab.querySelectorAll(".form-control");
                var name = newGroupUnit[0].value;
                var param1 = newGroupUnit[1].value;
                var param2 = newGroupUnit[2].value;
                
                if (name.length > 0 && !(name in relationObj)) {
                    relationObj[name] = {};
                    relationObj[name].child0 = [];
                    relationObj[name].child1 = [];
                } else {
                    alert("Please provide a valid name!");
                }

                prepareRelationContentField();
                loadGroupUnitOptions();
            }

            function deleteGroupUnit() {
                var selectDelete = document.getElementById("showGroupOptions");
                if (selectDelete.value == 0) {
                    return;
                } else {
                    delete relationObj[Object.keys(relationObj)[selectDelete.value]];
                }
                prepareRelationContentField();
                loadGroupUnitOptions();
            }

            function refreshRelationObject() {
                if (Object.keys(jsonSchema).length > 0) {
                    prepareCodeContentField();
                    loadRelation();
                    prepareRelationContentField();
                    loadGroupUnitOptions();
                }
            }

            function loadRelation() {
                relationObj.ROOT.child0 = [];
                relationObj.ROOT.child1 = [];

                for (let idx = 0; idx < 6; idx++) {
                    var row = parseInt(idx / 3);
                    var column = idx % 3;
                    if (typeof cellArray[row][column] != "undefined") {
                        for (let count = 0; count < cellArray[row][column].length; count++) {
                            let nodeName = ""; //Op_row_col_count_phase
                            let lineContent = cellArray[row][column][count].Content;
                            let lineId = Number(cellArray[row][column][count].ID);
                            let phase = phaseObj[lineContent.substring(0, lineContent.indexOf(" "))];
                            for(let num = 1; num < Number(phase) + 1; num++){
                                relationObj.ROOT.child0.push("Op_" + lineId + "_" + num);
                                /*
                                relationObj.LOOP0.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
                                relationObj.LOOP0_BODY.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
                                relationObj.LOOP1.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
                                relationObj.LOOP1_BODY.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
                                relationObj.LOOP2.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
                                relationObj.LOOP2_BODY.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
                                */
                            }
                        }
                    }
                }
                console.log(relationObj);
            }

            function prepareRelationContentField() {
                let keys = Object.keys(relationObj);
                if (relationObj.ROOT.child0.length == 0) {
                    return;
                }
                /*
                <div class="container">
                  <div class="row">
                    <ul class="list-group" id="nodeGroupList">
                      <li class="list-group-item borderless" id="nodeGroupUnit">
                        <p id="unitName"></p>
                      </li>
                      <li class="list-group-item borderless"></li>
                      ...
                    </ul>
                  </div>
                </div>
                */

                /*
                <div class="container">
                  <div class="row">
                    <div id="nodeGroupUnit">
                      <p id="unitName"></p>
                      <p id="unitLine"></p>
                      ...
                    </div>
                  </div>
                </div>
                */
                var divRelationField = document.getElementById("relationArrayContainer");
                divRelationField.innerHTML = "";
                
                var divLayoutRow = document.createElement("div");
                divLayoutRow.className = "row";

                //var divNodeGroupList = document.createElement("div");
                
                for (let count = 0; count < keys.length; count++) {
                    let i = 0;
                    let memberStr = "";
                    let lineLimit = 6;
                    var divNodeGroupUnit = document.createElement('div');
                    divNodeGroupUnit.id = "nodeGroupUnit";
                    
                    var pGroupName = document.createElement('p');
                    pGroupName.className = "font-weight-bold";
                    pGroupName.innerHTML = keys[count] + "\n";

                    divNodeGroupUnit.appendChild(pGroupName);

                    var pGroupMemberLine = document.createElement('p');

                    //child0
                    if (relationObj[keys[count]].child0.length > lineLimit) {
                        memberStr = "[ ";
                        for (i = 0; i < lineLimit; i++) {
                            memberStr += relationObj[keys[count]].child0[i] + ", ";
                        }
                        
                        for (; i < relationObj[keys[count]].child0.length; i++) {
                            if (i % lineLimit == 0 && i < relationObj[keys[count]].child0.length) {
                                pGroupMemberLine.innerHTML = memberStr;
                                divNodeGroupUnit.appendChild(pGroupMemberLine);
                                memberStr = "&nbsp;&nbsp;";
                                pGroupMemberLine = document.createElement('p');
                            }
                            memberStr += relationObj[keys[count]].child0[i] + ", ";
                        }
                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupUnit.appendChild(pGroupMemberLine);

                    } else {
                        memberStr = "[ ";
                        for (i = 0; i < relationObj[keys[count]].child0.length; i++) {
                            memberStr += relationObj[keys[count]].child0[i] + ", ";
                        }

                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupUnit.appendChild(pGroupMemberLine);
                    }

                    //child1
                    pGroupMemberLine = document.createElement('p');
                    if (relationObj[keys[count]].child1.length > lineLimit) {
                        memberStr = "[ ";
                        for (i = 0; i < lineLimit; i++) {
                            memberStr += relationObj[keys[count]].child1[i] + ", ";
                        }

                        for (; i < relationObj[keys[count]].child1.length; i++) {
                            if (i % lineLimit == 0 && i < relationObj[keys[count]].child1.length) {
                                pGroupMemberLine.innerHTML = memberStr;
                                divNodeGroupUnit.appendChild(pGroupMemberLine);
                                memberStr = "&nbsp;&nbsp;";
                                pGroupMemberLine = document.createElement('p');
                            }
                            memberStr += relationObj[keys[count]].child1[i] + ", ";
                        }
                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupUnit.appendChild(pGroupMemberLine);

                    } else {
                        memberStr = "[ ";
                        for (i = 0; i < relationObj[keys[count]].child1.length; i++) {
                            memberStr += relationObj[keys[count]].child1[i] + ", ";
                        }
                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupUnit.appendChild(pGroupMemberLine);
                    }

                    divLayoutRow.appendChild(divNodeGroupUnit);
                }
                divRelationField.appendChild(divLayoutRow);
            }

        /*************************************************DEPENDENCY********************************************************/
            function refreshDependencyObject() {
                if (jsonSchema != null) {

                }
            }
        /***************************************************Canvas**********************************************************/
        /* Description of mermaid API usage and binding events
        Click button DRAW, the render function in drawDiagram() will be called and graph1 will be generated.
        After generation the render function calls the provided callback function - insertSvg()
        The callback function is called with two parameters, the svg code of the generated graph and a function. 
        This function binds events to the svg after it is inserted into the DOM. In this case an click event.
        If the click event is triggered, the graph2 will be generated in the same way for presentation.
        */
            function handleReproduceClick() {
                var element = document.getElementById("diagram");
                
                var insertSvg = function (svgCode, bindFunctions) {
                    element.innerHTML += svgCode;
                    //console.log(svgCode);
                };

                var graphDefinitionRoot = 'graph TD\n A(ROOT) --> A1{0}\n subgraph ROOT\n A1\n B1[Op_0_1_0_1] -.->|1,+INF| B2[Op_0_1_1_1]\n \
                                           B1[Op_0_1_0_1] -.->|1,1| B3[Op_0_1_1_2]\n end';

                mermaid.mermaidAPI.render('graph2', graphDefinitionRoot, insertSvg);

                console.log("draw");
            }

            function reproduceDiagram(element) {
                element.setAttribute('onclick', 'handleReproduceClick()');
            }

            function drawDiagram() {
                var element = document.getElementById("diagram");
                var graphDefinitionRoot = 'graph TD\n A(ROOT) --> A1{0}\n subgraph ROOT\n A1\n B1[Op_0_1_0_1] -.->|1,+INF| B2[Op_0_1_1_1]\n \
                                           B1[Op_0_1_0_1] -.->|1,1| B3[Op_0_1_1_2]\n end';

                var insertSvg = function (svgCode, bindFunctions) {
                    element.innerHTML = svgCode;
                    if(typeof callback !== 'undefined'){
                        callback(id);
                    }
                    bindFunctions = reproduceDiagram;
                    bindFunctions(element);
                    //or the above two lines can be merged to reproduceDiagram(element);
                };

                mermaid.mermaidAPI.render('graph1', graphDefinitionRoot, insertSvg, element);
            }

            function clearDiagram() {
                document.getElementById("diagram").innerHTML = "";
            }

        /*************************Test program. Use random number generator to select the index of instruction**************************/
            function handleRunTestProgram() {
                var programLength = 5;
                generateRandomProgram(programLength);
            }

            function generateRandomProgram(length) {
                for (var count = 0; count < length; count++){
                    var index = Math.floor(Math.random() * Object.keys(instructionMap).length) + 1;
                    var cellPos = Math.floor(Math.random() * 2) + "," + Math.floor(Math.random() * 3);
                    document.getElementById("editableFields").innerHTML = "";

                    prepareEditableFields(true, instructionMap[index], null, cellPos);
                    completeInput();
                    insertUserInput();
                }
            }

            function clearTestProgram() {
                if (confirm('Delete all program?')) {
                    instrID = 1;
                    textareaWl = 0;
                    updateSpanWl(textareaWl);
                    programManager = {}
                    initCell();
                    initObjects();
                    prepareCodeContentField();
                    document.getElementById("userInput").value = null;
                    document.getElementById("editableFields").innerHTML = "";
                }
            }

/************************************************End**********************************************************/


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