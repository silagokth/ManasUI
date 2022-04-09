/*
In this version(0.0.1), program lines are organized and displayed in order.
(perhaps describing some functionality here...)
However, a unordered list might be more appropriated to organize program lines because they don't need to be in order.
Thus, we don't need to calculate position for each line in textarea.
So I will switch to v0.0.2.
*/

            //Store the json content as an object
            var jsonSchema = {};
            //Map the value of "select" to instruction name
            const instructionMap = {};//{1: 'HALT', 2: 'REFI', 3: 'DPU', 4: 'SWB', 5: 'JUMP', 6: 'WAIT', 7: 'LOOP', 8: 'RACCU', 9: 'BRANCH', 10: 'ROUTE', 11: 'SRAM'}
            //Hold the current selected instruction
            let currentSelectedInstr = "";
            //Record the order of all input lines in textarea
            var programLines = ['\n'];
            //Record the start position of each line
            var programLineEndPos = [document.getElementById("programFields").value.length];
            //save the current selected line number
            let textareaWl = 0;
            //instruction id counter
            let instrID = 0;

            //CODE section
            var cellArray;
            let cellInputToArray = "";
            const cellAllocation = ['\n'];

            //RELATION section
            const relationObj = {};
            const phaseObj = {};
            //DEPENDENCY section

            //a potential programLine class 
            class programLine {
                segmentOptionObject = new Object;

                createLineFromUserInput(userInputArg) {
                    this.userInput = userInputArg;
                    this.name = this.userInput.substring(0, this.userInput.indexOf(" "));
                    this.phase = phaseObj[this.name];
                    var segmentOptStr = this.userInput.substring(this.userInput.indexOf(" ") + 1, this.userInput.length);
                    var segmentOptionArray = segmentOptStr.split(', ');
                    for (var counter = 0; counter < segmentOptionArray.length; counter += 1) {
                        var segmentPair = segmentOptionArray[counter].split('=');
                        this.segmentOptionObject[String(segmentPair[0])] = segmentPair[1];
                    }
                    //generate full line

                }

                setCellPosition(rowArg, colArg) {
                    this.row = rowArg;
                    this.column = colArg;
                }

                setWorkingLine(wlArg) {
                    this.workingLine = wlArg;
                }

                setEndPosition(endPos) {
                    this.endPosition = endPos;
                }

            }


            //For testing purpose, a division to display the loaded json file
            const schemaDiv = document.getElementById('schema');

            document.getElementById('inputFiles').addEventListener('change', handleFileSelect, false);


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

            function loadselectedInstructionLine(indexOfLine) {
                if (programLines[indexOfLine].length > 0) {
                    var instructionName = programLines[indexOfLine].substring(0, programLines[indexOfLine].indexOf(" "));
                    var segmentOptStr = programLines[indexOfLine].substring(programLines[indexOfLine].indexOf(" ") + 1, programLines[indexOfLine].length);
                    var cellPosition = cellAllocation[indexOfLine];

                    document.getElementById("editableFields").innerHTML = "";
                    prepareEditableFields(false, instructionName, segmentOptStr, cellPosition);
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
                        //console.log("Match name: " + instructionList[i].name);
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

                cellInputToArray = cellCollection[0].value + "," + cellCollection[1].value;

                cellUnitField.innerHTML = "<" + cellInputToArray + ">";

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
            function insertUserInput(isEnter) {
                var instrInputField = document.getElementById("userInput");
                var textareaProgramFields = document.getElementById("programFields");
                let validInstr = true;

                //validate the input
                if (!isEnter) {
                    if (instrInputField.value == "") {
                        return;
                    }

                    if (instrInputField.value == currentSelectedInstr) {
                        //user doesn't assign value to any segment
                        var instructionList = jsonSchema.instruction_templates;
                        for (let i in instructionList) {
                            if (instructionList[i].name == currentSelectedInstr.substring(0, currentSelectedInstr.length - 1)) {
                                //console.log(instructionList[i].name);
                                //console.log(Object.keys(instructionList[i].segment_templates).length);
                                if (Object.keys(instructionList[i].segment_templates).length > 0) {
                                    validInstr = false;//or use default values????????????????????????????
                                }
                            }
                        }
                    }
                } else {
                    cellInputToArray = "";
                }

                if (validInstr) {
                    var opCode = 1;
                    var insertContent = "";
                    var insertToTail = textareaWl == (programLines.length - 1);
                    let pLine = new programLine();

                    //prepare content
                    if (!isEnter) {
                        insertContent = instrInputField.value;
                    }

                    reorganizeProgramArray(opCode, insertToTail, insertContent);
                    repaintTextarea(insertToTail);
                    //pLine.setEndPosition() need to be done in recalculateLineEndPosition() since all lines after will be affected
                    recalculateLineEndPosition(opCode, insertToTail, (insertContent.length + 9));
                    pLine.createLineFromUserInput(insertContent);
                    pLine.setCellPosition(Number(cellInputToArray[0]), Number(cellInputToArray[2]));
                    pLine.setWorkingLine(textareaWl + 1);

                    if (insertToTail) {
                        updateSpanWl(programLines.length - 1);
                        //adjust window put the insert line in the middle or to the end
                        textareaProgramFields.scrollTop = textareaProgramFields.scrollHeight;
                    } else {
                        updateSpanWl(textareaWl + 1);
                    }

                    loadselectedInstructionLine(textareaWl);
                    console.log("Insert: " + instrInputField.value);
                }
            }

            function modifyUserSelect() {
                var instrInputField = document.getElementById("userInput");
                var textareaProgramFields = document.getElementById("programFields");
                let validInstr = true;

                if (instrInputField.value == "")
                    return;

                if (instrInputField.value == currentSelectedInstr) {
                    //user doesn't assign value to any segment
                    var instructionList = jsonSchema.instruction_templates;
                    for (let i in instructionList) {
                        if (instructionList[i].name == currentSelectedInstr.substring(0, currentSelectedInstr.length - 1)) {
                            if (Object.keys(instructionList[i].segment_templates).length > 0) {
                                validInstr = false;
                            }
                        }
                    }
                }

                if (validInstr) {
                    var substituteContent = instrInputField.value;
                    //prepare content
                    var selectedContent = programLines[textareaWl];
                    //get working line and insert to the next line
                    var lineNumberStr = getLineNumberString(textareaWl);

                    if (confirm('Modify line: "' + lineNumberStr + '   ' + selectedContent + '"?')) {
                        var opCode = 3;
                        reorganizeProgramArray(opCode, false, substituteContent);
                        repaintTextarea(false);
                        recalculateLineEndPosition(opCode, false, (substituteContent.length - selectedContent.length));
                    }
                }
            }

            function deleteUserSelect() {
                var textareaProgramFields = document.getElementById("programFields");
                var targetContent;

                if (programLines.length < 2 || textareaWl < 1) {//do nothing if textarea is empty
                    return;
                }

                //console.log("textareaWl: " + textareaWl);
                //console.log("programLineEndPos: " + programLineEndPos);
                //Get the content to be deleted.
                targetContent = textareaProgramFields.value.substring(programLineEndPos[textareaWl - 1] + 1, programLineEndPos[textareaWl]);

                if (confirm('Delete line: "' + targetContent + '"?')) {
                    var opCode = 2;
                    //console.log("program length BEFORE: " + (programLines.length - 1));
                    reorganizeProgramArray(opCode, false, null);
                    //console.log("program length AFTER: " + (programLines.length - 1));

                    //console.log("textarea BEFORE: " + textareaProgramFields.value);
                    repaintTextarea(false);
                    //console.log("textarea AFTER: " + textareaProgramFields.value);

                    //console.log("textarea BEFORE: " + programLineEndPos);
                    recalculateLineEndPosition(opCode, false, targetContent.length);
                    //console.log("textarea AFTER: " + programLineEndPos);

                    if (textareaWl >= programLines.length) {
                        //move the working line to the new last line if the last line was deleted.
                        updateSpanWl(programLines.length - 1);
                    }

                    loadselectedInstructionLine(textareaWl);
                }
            }

        /*
        In the text editor for instructions, three types of button are provided for operations of inserting, modifying and deleting an instruction line.
        The operation of inserting is divided into two buttons. One is for inserting an instruction line from user input field and another is for inserting an empty line.
        Before each operation, user need to specify a line which the operation should perform on by clicking on a specific line and the content of that line will be loaded into the user inout field.
        Then the user can choose to 1.insert a new instruction line or an empty line after the selected line, 2.modify the selected line, 3. delete the selected line.
        Insert a new instruction line:
            1. select instruction,
            2. click EDIT button to get the input form of segments,
            3. fill up value of segment based on needs and click OK to confirm and generate an instruction line loaded into user input field,
            4. click INSERT button and then the new instruction will be added to the next line of the selected line.
        Insert an empty line: click ENTER button and an empty line will be added to the next line of the selected line.
        Modify the selected line:
            1. select instruction
            2. click EDIT button to get the input form of segments,
            3. fill up value of segment based on needs and click OK to confirm and generate an instruction line loaded into user input field,
            4. click MODIFY button and then the selected line will be replaced by the new instruction line.
        Delete the selected line: click DELETE button and the selected line will be removed and the lines after the deleted one will be move one line up.
        */
            function handleClickOnTextarea() {
                var ta = document.getElementById("programFields");//ta: textarea
                var lineCounter = 1;

                console.log(ta.selectionStart + ":" + ta.selectionEnd);
                if (ta.selectionStart == 0 && programLineEndPos.length > 1) {
                    updateSpanWl(1);
                    loadselectedInstructionLine(1);
                    return;
                }

                if (ta.selectionStart > programLineEndPos[programLineEndPos.length - 1]) {
                    lineCounter = programLineEndPos.length - 1;
                    updateSpanWl(lineCounter);
                    loadselectedInstructionLine(lineCounter);
                    return;
                }

                for (; lineCounter < programLineEndPos.length; lineCounter += 1) {
                    if (ta.selectionStart > programLineEndPos[lineCounter - 1] && ta.selectionStart <= programLineEndPos[lineCounter]) {
                        updateSpanWl(lineCounter);
                        loadselectedInstructionLine(lineCounter);
                        break;
                    }
                }
            }

            function reorganizeProgramArray(operation, isTail, newContent) {
                if (isTail) {
                    programLines[programLines.length] = newContent;
                    cellAllocation[cellAllocation.length] = cellInputToArray;
                }
                else {
                    switch (operation) {
                        case 1://insert
                            programLines.splice(textareaWl + 1, 0, newContent);
                            cellAllocation.splice(textareaWl + 1, 0, cellInputToArray);
                            break;
                        case 2://delete
                            programLines.splice(textareaWl, 1);
                            cellAllocation.splice(textareaWl, 1);
                            break;
                        case 3://modify
                            programLines[textareaWl] = newContent;
                            cellAllocation[textareaWl] = cellInputToArray;
                            break;
                    }
                }
            }

            function repaintTextarea(isTail) {
                var textareaProgramFields = document.getElementById("programFields");
                if (isTail) {
                    textareaProgramFields.value += getLineNumberString(textareaWl + 1) + "   " + programLines.slice(-1) + '\n';
                }
                else {
                    var counter = 1;
                    textareaProgramFields.value = "";
                    for (; counter < programLines.length; counter += 1) { //re-organize lines in textarea
                        var lineNumberStr = getLineNumberString(counter);
                        textareaProgramFields.value += lineNumberStr + "   " + programLines[counter] + '\n';
                    }
                }
            }

            function recalculateLineEndPosition(operation, isTail, lenDeviation) {
                if (isTail)
                    programLineEndPos[programLineEndPos.length] = document.getElementById("programFields").value.length - 1;
                else {
                    switch(operation){
                        case 1://re-calculate the end position of lines from the last line to the inserted line
                            //console.log("Insert lenDeviation: " + lenDeviation);
                            for (var counter = programLineEndPos.length; counter > textareaWl; counter -= 1) {
                                programLineEndPos[counter] = programLineEndPos[counter - 1] + lenDeviation;
                            }
                            break;
                        case 2://re-calculate the end position of lines behind the deleted one and move them one step up
                            for (var counter = textareaWl + 1; counter < programLineEndPos.length; counter += 1) {
                                programLineEndPos[counter - 1] = programLineEndPos[counter] - lenDeviation - 1;
                            }
                            programLineEndPos.length = programLineEndPos.length - 1;
                            break;
                        case 3://re-calculate the end position of lines from the last line to the modified line
                            for (var counter = programLineEndPos.length - 1; counter > textareaWl - 1; counter -= 1) {
                                programLineEndPos[counter] = programLineEndPos[counter] + lenDeviation;
                            }
                            break;
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

                if (number < 10) addzero = "0000";
                else if (number < 100) addzero = "000";
                else if (number < 1000) addzero = "00";
                else if (number < 10000) addzero = "0";

                return (addzero + String(number));
            }

        /****************************************************CODE***********************************************************/
            function refreshCodeObject() {
                if (Object.keys(jsonSchema).length > 0) {
                    initCell();
                    prepareFullInstructionLine();
                    prepareCodeContentField();
                }
            }

            function initCell() {
                cellArray = new Array(new Array(3), new Array(3));
            }

            function prepareFullInstructionLine() {
                var instructionList = jsonSchema.instruction_templates;

                for (var count = 0; count < programLines.length; count++) {
                    if (programLines[count].length < 1) {
                        continue;//skip empty line
                    }
                    var instrName = programLines[count].substring(0, programLines[count].indexOf(" "));
                    var segmentOptStr = programLines[count].substring(programLines[count].indexOf(" ") + 1, programLines[count].length);
                    var cellRow = Number(cellAllocation[count][0]);
                    var cellColumn = Number(cellAllocation[count][2]);


                    for (let i in instructionList) {
                        if (instructionList[i].name == instrName) {
                            var segmentList = instructionList[i].segment_templates;
                            var segmentOptionArray = segmentOptStr.split(', ');
                            var segmentOptionObject = {};
                            var currentLine = instructionList[i].name;


                            for (var counter = 0; counter < segmentOptionArray.length; counter += 1) {
                                var segmentPair = segmentOptionArray[counter].split('=');
                                segmentOptionObject[String(segmentPair[0])] = segmentPair[1];
                            }

                            for (let j in segmentList) {
                                var segValue = segmentOptionObject[segmentList[j].name];
                                if (typeof segValue != "undefined") {
                                    currentLine += " " + segValue;
                                } else if (typeof segmentList[j].default_val != "undefined") {
                                    currentLine += " " + segmentList[j].default_val;
                                } else {
                                    currentLine += " " + 0;
                                }
                            }

                            if (typeof cellArray[cellRow][cellColumn] == "undefined") {
                                cellArray[cellRow][cellColumn] = new Array();
                            }
                            cellArray[cellRow][cellColumn].push(currentLine);
                            break;
                        }
                    }
                }
            }

            function prepareCodeContentField() {
                /*
                <div class="container">
                  <div class="row">
                    <ul class="list-group">
                      <li class="list-group-item borderless">
                        <p class="font-weight-bold">CELL<r,c></p>
                      </li>
                      <li class="list-group-item borderless"></li>
                    </ul>
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
                    console.log(row +","+column);
                    if (typeof cellArray[row][column] != "undefined") {
                        var divCellUnit = document.createElement("div");
                        divCellUnit.className = "row";
                        var ulInstrLines = document.createElement("ul");
                        ulInstrLines.className = "list-group";
                        var liUnitName = document.createElement('li');
                        liUnitName.className = "list-group-item borderless";

                        var pUnitName = document.createElement('p');
                        pUnitName.className = "font-weight-bold";
                        pUnitName.innerHTML = "CELL <" + row + "," + column + ">";
                        liUnitName.appendChild(pUnitName);
                        ulInstrLines.appendChild(liUnitName);

                        for (count = 0; count < cellArray[row][column].length; count++) {
                            var liInstrLine = document.createElement('li');
                            liInstrLine.className = "list-group-item borderless";
                            liInstrLine.innerHTML = cellArray[row][column][count];
                            ulInstrLines.appendChild(liInstrLine);
                        }
                        divCellUnit.appendChild(ulInstrLines);
                        divCodeField.appendChild(divCellUnit);
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
                    refreshCodeObject();
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
                            let fullIns = cellArray[row][column][count];
                            let phase = phaseObj[fullIns.substring(0, fullIns.indexOf(" "))];
                            for(let num = 1; num < Number(phase) + 1; num++){
                                relationObj.ROOT.child0.push("Op_" + row + "_" + column + "_" + count + "_" + num);
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
                    insertUserInput(false);
                }
            }

            function clearTestProgram() {
                if (confirm('Delete all program?')) {
                    var textareaProgramFields = document.getElementById("programFields");
                    var targetContent;

                    if (programLines.length < 2 || textareaWl < 1) {//do nothing if textarea is empty
                        return;
                    }

                    programLines = ['\n'];
                    programLineEndPos = [document.getElementById("programFields").value.length];
                    textareaWl = 0;
                    updateSpanWl(textareaWl);
                    textareaProgramFields.value = "";
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