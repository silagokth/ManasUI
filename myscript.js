/*
This is version 0.0.3
*/
$(document).ready(function () {
    var $flowchart = $('#flowchartworkspace');
    var $container = $flowchart.parent();
    $("#resizable").resizable();

    // Apply the plugin on a standard, empty div...
    $flowchart.flowchart({
        data: defaultFlowchartData,
        defaultSelectedLinkColor: '#000055',
        linkWidth: 3,
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
    panzoom.pan(10, 10);
    panzoom.zoom(1, { animate: true });

    $('#zoom_in').click(function () {
        panzoom.zoomIn();
        $flowchart.flowchart('setPositionRatio', panzoom.getScale());
    });

    $('#zoom_out').click(function () {
        panzoom.zoomOut();
        $flowchart.flowchart('setPositionRatio', panzoom.getScale());
    });

    //-------------------------------------------------

    //for draggable element
    function getOperatorData($element) {
        var nbInputs = parseInt($element.data('nb-inputs'), 10);
        var nbOutputs = parseInt($element.data('nb-outputs'), 10);
        var data = {
            properties: {
                title: $element.text(),
                inputs: {},
                outputs: {}
            }
        };

        var i = 0;
        for (i = 0; i < nbInputs; i++) {
            data.properties.inputs['input_' + i] = {
                //label: 'Input ' + (i + 1)
                label: ' '
            };
        }
        for (i = 0; i < nbOutputs; i++) {
            data.properties.outputs['output_' + i] = {
                //label: 'Output ' + (i + 1)
                label: ' '
            };
        }

        return data;
    }

    //-----------------------------------------
    //--- operator and link properties
    //--- start
    var $operatorProperties = $('#operator_properties');
    $operatorProperties.hide();
    var $linkProperties = $('#link_properties');
    $linkProperties.hide();
    var $opGroupProperties = $('#opGroup_properties');
    $opGroupProperties.hide();

    var $operatorTitle = $('#operator_title');
    var $linkColor = $('#link_color');

    var $opGroupTitle = $('#opGroup_title');
    var $opGroupParent = $('#opGroup_parent');
    var $opGroupX = $('#opGroup_x');
    var $opGroupY = $('#opGroup_y');
    var $opGroupWidth = $('#opGroup_width');
    var $opGroupHeight = $('#opGroup_height');


    $flowchart.flowchart({
        onOperatorSelect: function (operatorId) {
            $operatorProperties.show();
            $operatorTitle.val($flowchart.flowchart('getOperatorTitle', operatorId));
            return true;
        },
        onOperatorUnselect: function () {
            $operatorProperties.hide();
            return true;
        },
        onLinkSelect: function (linkId) {
            $linkProperties.show();
            $linkColor.val($flowchart.flowchart('getLinkMainColor', linkId));
            return true;
        },
        onLinkUnselect: function () {
            $linkProperties.hide();
            return true;
        },
        onOpGroupSelect: function (opGroupId) {
            $opGroupProperties.show();
            var infos = $flowchart.flowchart('getOpGroupInfos', opGroupId);
            $opGroupTitle.val(infos.title);
            $opGroupParent.val(infos.parent);
            $opGroupX.val(infos.geometric.rect_x);
            $opGroupY.val(infos.geometric.rect_y);
            $opGroupWidth.val(infos.geometric.rect_width);
            $opGroupHeight.val(infos.geometric.rect_height);
            return true;
        },
        onOpGroupUnselect: function () {
            $opGroupProperties.hide();
            return true;
        }
    });

    $operatorTitle.keyup(function () {
        var selectedOperatorId = $flowchart.flowchart('getSelectedOperatorId');
        if (selectedOperatorId != null) {
            $flowchart.flowchart('setOperatorTitle', selectedOperatorId, $operatorTitle.val());
        }
    });

    $linkColor.change(function () {
        var selectedLinkId = $flowchart.flowchart('getSelectedLinkId');
        if (selectedLinkId != null) {
            $flowchart.flowchart('setLinkMainColor', selectedLinkId, $linkColor.val());
        }
    });

    $('#setOpGroupInfos').click(function () {
        var selectedOpGroupId = $flowchart.flowchart('getSelectedOpGroupId');
        if (selectedOpGroupId != null) {
            var infos = {
                title: $opGroupTitle.val(),
                parent: $opGroupParent.val(),
                geometric: {
                    rect_x: $opGroupX.val(),
                    rect_y: $opGroupY.val(),
                    rect_width: $opGroupWidth.val(),
                    rect_height: $opGroupHeight.val(),
                }
            }
            $flowchart.flowchart('setOpGroupInfos', selectedOpGroupId, infos);
        }
    });

    //--- end
    //--- operator and link properties
    //-----------------------------------------

    //-----------------------------------------
    //--- delete operator / link button
    //--- start
    $('#delete_selected').click(function () {
        $flowchart.flowchart('deleteSelected');
    });
    //--- end
    //--- delete operator / link button
    //-----------------------------------------



    //-----------------------------------------
    //--- create operator button
    //--- start
    var operatorI = 0;
    $('#create_operator').click(function () {
        var operatorId = 'created_operator_' + operatorI;
        var operatorData = {
            top: ($flowchart.height() / 2) - 30,
            left: ($flowchart.width() / 2) - 100 + (operatorI * 10),
            properties: {
                title: 'Operator ' + (operatorI + 1),
                inputs: {
                    input_1: {
                        //label: 'Input 1',
                        label: ' ',
                    }
                },
                outputs: {
                    output_1: {
                        //label: 'Output 1',
                        label: ' ',
                    }
                }
            }
        };

        operatorI++;

        $flowchart.flowchart('createOperator', operatorId, operatorData);

    });
    //--- end
    //--- create operator button
    //-----------------------------------------

    //--- create operator button
    //--- start
    var opGroupId = 0;
    function addOpGroupToFlowchart() {
        var opGroupData = {
            title: 'Group ' + (opGroupId + 1),
            parent: 'ROOT',
            geometric:{
                rect_x: 100 + (opGroupId * 10),
                rect_y: 100 + (opGroupId * 10),
                rect_width: 500,
                rect_height: 500,
            },
            entry: {
                top: 150,
                left: 100 + (opGroupId * 10) + 50,
                properties: {
                    title: '0',
                    inputs: {
                        input_1: {
                            label: ' ',
                        },
                    }
                }
            }
        };
        opGroupId++;
        $flowchart.flowchart('createOpGroup', opGroupId, opGroupData);
    }
    $('#create_opGroup').click(addOpGroupToFlowchart);
    //--- end
    //--- create operator button
    //-----------------------------------------



    //-----------------------------------------
    //--- save and load
    //--- start
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
});
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
                    for (let count = 0; count < segmentOptionArray.length; count += 1) {
                        var segmentPair = segmentOptionArray[count].split('=');
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

                getNodeArray() {
                    let nodeArr = [];
                    for (let count = 1; count < Number(this.phase) + 1; count++) {
                        nodeArr.push("Op_" + getLineNumberString(this.getId()) + "_" + count);
                    }
                    return nodeArr;
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

            function initRelation() {
                relationManager = {};
                rootGroup = new GroupUnit("ROOT");
                relationManager[rootGroup.getGroupName()] = rootGroup;
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
                initRelation();
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
                appendNodeFromNewLine(pLine.getNodeArray());
                addOperatorToFlowchartData(pLine.getNodeArray());
                addConstriantForInnerNode(pLine.getNodeArray());
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
            var relationManager = {};
            var nodeMap = {};

            class NodeUnit {
                constructor(nameArg, parentArg, subgroupArg) {
                    this.name = nameArg;
                    this.parent = parentArg;
                    this.subgroup = subgroupArg;
                }

                setParent(parentArg) {
                    this.parent = parentArg;
                }

                setSubgroup(num) {
                    if (num == 1)
                        this.subgroup = 1;
                    else
                        this.subgroup = 0;
                }

                getName(){
                    return this.name;
                }

                getParent(){
                    return this.parent;
                }

                getSubgroup() {
                    if (this.subgroup == 0)
                        return "subgroup0";
                    else
                        return "subgroup1";
                }
            }

            class GroupUnit {
                constructor(nameArg) {
                    this.name = nameArg;
                    this.childGroup = [];
                    this.parentGroup = [];
                    this.subgroup0 = [];
                    this.subgroup1 = [];
                }

                getGroupName() {
                    return this.name;
                }

                setParentGroup(parent) {
                    this.parentGroup.push(parent);
                }

                getParentGroup() {
                    return this.parentGroup;
                }

                getChildGroup() {
                    return this.childGroup;
                }

                getSubgroup0() {
                    return this.subgroup0;
                }

                getSubgroup1() {
                    return this.subgroup1;
                }

                getSubgroup(whichGroup) {
                    if (whichGroup == "subgroup0" || whichGroup == 0) {
                        return this.subgroup0;
                    } else if (whichGroup == "subgroup1" || whichGroup == 1) {
                        return this.subgroup1;
                    }
                }

                appendGroup(groupName) {
                    var index = this.childGroup.length;
                    this.childGroup.push(groupName);
                    this.subgroup0.splice(index, 0, groupName);
                }

                appendNode(nodeName, whereToAdd) {
                    if (whereToAdd == "subgroup0") {
                        this.subgroup0.push(nodeName);
                    } else if (whereToAdd == "subgroup1") {
                        this.subgroup1.push(nodeName);
                    }
                }

                deleteNode(nodeName, whereToDelete) {
                    if (whereToDelete == "childGroup") {
                        for (let count = 0; count < this.childGroup.length; count++) {
                            if (nodeName == this.childGroup[count]) {
                                this.childGroup.splice(count, 1);
                                break;
                            }
                        }
                        for (count = 0; count < this.subgroup0.length; count++) {
                            if (nodeName == this.subgroup0[count]) {
                                this.subgroup0.splice(count, 1);
                                break;
                            }
                        }
                    } else if (whereToDelete == "parentGroup") {
                        for (let count = 0; count < this.parentGroup.length; count++) {
                            if (nodeName == this.parentGroup[count]) {
                                this.parentGroup.splice(count, 1);
                                break;
                            }
                        }
                    } else if (whereToDelete == "subgroup0") {
                        for (let count = 0; count < this.subgroup0.length; count++) {
                            if (nodeName == this.subgroup0[count]) {
                                this.subgroup0.splice(count, 1);
                                break;
                            }
                        }
                    } else if (whereToDelete == "subgroup1") {
                        for (let count = 0; count < this.subgroup1.length; count++) {
                            if (nodeName == this.subgroup1[count]) {
                                this.subgroup1.splice(count, 1);
                                break;
                            }
                        }
                    }
                }
            }

            function prepareRelationContentField() {
                /*
                <div class="container">
                  <div class="row">
                    <div id="nodeGroupBlock">
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

                let keys = Object.keys(relationManager);
                for (let count = 0; count < keys.length; count++) {
                    let i = 0;
                    let memberStr = "";
                    let lineLimit = 8;
                    var divNodeGroupBlock = document.createElement('div');
                    divNodeGroupBlock.id = "nodeGroupBlock";

                    var pGroupName = document.createElement('p');
                    pGroupName.className = "font-weight-bold";
                    pGroupName.innerHTML = keys[count] + "\n";

                    divNodeGroupBlock.appendChild(pGroupName);

                    var pGroupMemberLine = document.createElement('p');

                    //subgroup0
                    let subgroup0Arr = relationManager[keys[count]].getSubgroup0();
                    if (subgroup0Arr.length > lineLimit) {
                        memberStr = "[ ";
                        for (i = 0; i < lineLimit; i++) {
                            memberStr += subgroup0Arr[i] + ", ";
                        }

                        for (; i < subgroup0Arr.length; i++) {
                            if (i % lineLimit == 0 && i < subgroup0Arr.length) {
                                pGroupMemberLine.innerHTML = memberStr;
                                divNodeGroupBlock.appendChild(pGroupMemberLine);
                                memberStr = "&nbsp;&nbsp;";
                                pGroupMemberLine = document.createElement('p');
                            }
                            memberStr += subgroup0Arr[i] + ", ";
                        }
                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupBlock.appendChild(pGroupMemberLine);
                    } else {
                        memberStr = "[ ";
                        for (i = 0; i < subgroup0Arr.length; i++) {
                            memberStr += subgroup0Arr[i] + ", ";
                        }

                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupBlock.appendChild(pGroupMemberLine);
                    }

                    //subgroup1
                    let subgroup1Arr = relationManager[keys[count]].getSubgroup1();
                    pGroupMemberLine = document.createElement('p');
                    if (subgroup1Arr.length > lineLimit) {
                        memberStr = "[ ";
                        for (i = 0; i < lineLimit; i++) {
                            memberStr += subgroup1Arr[i] + ", ";
                        }

                        for (; i < subgroup1Arr.length; i++) {
                            if (i % lineLimit == 0 && i < subgroup1Arr.length) {
                                pGroupMemberLine.innerHTML = memberStr;
                                divNodeGroupBlock.appendChild(pGroupMemberLine);
                                memberStr = "&nbsp;&nbsp;";
                                pGroupMemberLine = document.createElement('p');
                            }
                            memberStr += subgroup1Arr[i] + ", ";
                        }
                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupBlock.appendChild(pGroupMemberLine);
                    } else {
                        memberStr = "[ ";
                        for (i = 0; i < subgroup1Arr.length; i++) {
                            memberStr += subgroup1Arr[i] + ", ";
                        }
                        if (memberStr.length > 5) {
                            memberStr = memberStr.slice(0, -2);
                        }
                        memberStr += " ]";
                        pGroupMemberLine.innerHTML = memberStr;
                        divNodeGroupBlock.appendChild(pGroupMemberLine);
                    }                    
                    divLayoutRow.appendChild(divNodeGroupBlock);
                }
                divRelationField.appendChild(divLayoutRow);
            }

            function handleSrcGroupSelect() {
                var srcGroupOptionsSelect = document.getElementById('showSourceGroupOptions');
                var srcSubgroupOptionsSelect = document.getElementById('showSourceSubgroupOptions');
                var showNodeOptionsSelect = document.getElementById('showNodeOptions');
                var selectedGroup = srcGroupOptionsSelect.options[srcGroupOptionsSelect.selectedIndex].text;
                var selectedSubgroup = srcSubgroupOptionsSelect.options[srcSubgroupOptionsSelect.selectedIndex].text;

                var nodeArray = relationManager[selectedGroup].getSubgroup(selectedSubgroup);
                showNodeOptionsSelect.innerHTML = "";
                for (let count = 0; count < nodeArray.length; count++) {
                    var optionNode = document.createElement('option');
                    optionNode.value = count;
                    optionNode.innerHTML = nodeArray[count];
                    showNodeOptionsSelect.append(optionNode);
                }
            }

            function loadGroupUnitOptions() {
                loadGroupUnitOptionsInRelation();
                loadGroupUnitOptionsInDependency();
            }

            function loadGroupUnitOptionsInRelation() {
                var groupOptionsSelect = document.getElementById('showGroupOptions');
                var srcGroupOptionsSelect = document.getElementById('showSourceGroupOptions');
                var destGroupOptionsSelect = document.getElementById('showDestGroupOptions');
                var parentGroupOptionsSelect = document.getElementById('showParentGroupOptions');
                var keyArray = Object.keys(relationManager);

                groupOptionsSelect.innerHTML = "";
                srcGroupOptionsSelect.innerHTML = "";
                destGroupOptionsSelect.innerHTML = "";
                parentGroupOptionsSelect.innerHTML = "";
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

                srcGroupOptionsSelect.addEventListener("change", handleSrcGroupSelect);
                document.getElementById('showSourceSubgroupOptions').addEventListener("change", handleSrcGroupSelect);

                srcGroupOptionsSelect.options[0].selected = true;
                document.getElementById('showSourceSubgroupOptions').options[0].selected = true;
                handleSrcGroupSelect();
            }

            function addGroupUnit() {
                var addTab = document.getElementById("v-pills-add");
                var newGroupUnit = addTab.querySelectorAll(".form-control");
                var name = newGroupUnit[0].value;
                var param1 = newGroupUnit[1].value;
                var param2 = newGroupUnit[2].value;
                var selectedParent = document.getElementById("showParentGroupOptions");
                var parent = selectedParent.options[selectedParent.selectedIndex].text;

                if(name in relationManager) {
                    alert("Group exists!");
                    return;
                }

                if (name.length > 0) {
                    var newGroup = new GroupUnit(name);
                    newGroup.setParentGroup(parent);
                    relationManager[newGroup.getGroupName()] = newGroup;
                    relationManager[parent].appendGroup(newGroup.getGroupName());
                } else {
                    alert("Please provide a valid name!");
                }

                prepareRelationContentField();
                loadGroupUnitOptions();

                newGroupUnit[0].value = "";
                newGroupUnit[1].value = "";
                newGroupUnit[2].value = "";
            }

            function deleteGroupUnit() {
                var selectDelete = document.getElementById("showGroupOptions");
                if (selectDelete.value == 0) {
                    return;
                } else {
                    var targetGroup = relationManager[selectDelete.options[selectDelete.selectedIndex].text];
                    var parent = targetGroup.getParentGroup()[0];
                    var childGroup = targetGroup.getChildGroup();
                    var subgroup = targetGroup.getSubgroup0();
                    subgroup.push.apply(subgroup, targetGroup.getSubgroup1());

                    for (let count = 0; count < childGroup.length; count++) {
                        var groupUnit = relationManager[childGroup[count]];
                        groupUnit.setParentGroup("ROOT");
                        relationManager["ROOT"].appendGroup(groupUnit.getGroupName());
                    }
                    console.log("[deleteGroupUnit] subgroup: " + subgroup);
                    for (let count = 0; count < subgroup.length; count++) {
                        var nodeUnit = nodeMap[subgroup[count]];
                        nodeUnit.setParent("ROOT");
                        nodeUnit.setSubgroup(0);
                        nodeMap[nodeUnit.getName()] = nodeUnit;
                        relationManager["ROOT"].appendNode(nodeUnit.getName(), "subgroup0");
                    }
                    
                    relationManager[parent].deleteNode(targetGroup.getGroupName(), "childGroup");
                    delete relationManager[targetGroup.getGroupName()];
                }
                prepareRelationContentField();
                loadGroupUnitOptions();
            }

            function allocateNode() {
                var srcGroupOptionsSelect = document.getElementById('showSourceGroupOptions');
                var srcSubgroupOptionsSelect = document.getElementById('showSourceSubgroupOptions');
                var nodeOptionsSelect = document.getElementById('showNodeOptions');
                var destGroupOptionsSelect = document.getElementById('showDestGroupOptions');
                var destSubgroupOptionsSelect = document.getElementById('showDestSubgroupOptions');

                var srcGroup = srcGroupOptionsSelect.options[srcGroupOptionsSelect.selectedIndex].text;
                var srcSubgroup = srcSubgroupOptionsSelect.options[srcSubgroupOptionsSelect.selectedIndex].text;
                var nodeName = nodeOptionsSelect.options[nodeOptionsSelect.selectedIndex].text;
                var destGroup = destGroupOptionsSelect.options[destGroupOptionsSelect.selectedIndex].text;
                var destSubgroup = destSubgroupOptionsSelect.options[destSubgroupOptionsSelect.selectedIndex].text;

                console.log("Move " + nodeName +  " from " + srcGroup + "." + srcSubgroup + " to "  + destGroup + "." + destSubgroup);
                if(nodeName in relationManager) {
                  if(nodeName == srcGroup || nodeName == destGroup){
                    alert("Invalid allocation!");
                    return;
                  }
                  if(destSubgroup == 1){
                    alert("Group can only be placed in Subgroup 0!");
                    return;
                  }
                  if(srcGroup == destGroup && srcSubgroup == destSubgroup){
                    return;
                  }

                  var groupUnit = relationManager[nodeName];
                  groupUnit.deleteNode(srcGroup, "parentGroup");
                  groupUnit.setParentGroup(destGroup);

                  relationManager[destGroup].appendGroup(groupUnit.getGroupName());
                  relationManager[srcGroup].deleteNode(groupUnit.getGroupName(), "childGroup");
                }else {
                  if(srcGroup == destGroup && srcSubgroup == destSubgroup){
                    return;
                  }
                  var nodeUnit = nodeMap[nodeName];

                  nodeUnit.setParent(destGroup);
                  nodeUnit.setSubgroup(Number(destSubgroup));
                  nodeMap[nodeName] = nodeUnit;
                  relationManager[destGroup].appendNode(nodeName, "subgroup" + destSubgroup);
                  relationManager[srcGroup].deleteNode(nodeName, "subgroup" + srcSubgroup);
                }

                prepareRelationContentField();
                loadGroupUnitOptions();
            }

            function appendNodeFromNewLine(nodeArray) {
                for (let count = 0; count < nodeArray.length; count++) {
                    nodeMap[nodeArray[count]] = new NodeUnit(nodeArray[count], "ROOT", 0);
                    relationManager["ROOT"].appendNode(nodeArray[count], "subgroup0");
                }
                prepareRelationContentField();
                loadGroupUnitOptions();
            }

            function deleteNodeAlongWithProgramLine(nodeArray) {
                for (let i = 0; i < nodeArray.length; i++) {
                    var nodeUnit = nodeMap[nodeArray[i]];
                    var parent = nodeUnit.getParent();
                    var subgroup = nodeUnit.getSubgroup();
                    relationManager[parent].deleteNode(nodeArray[i], subgroup);
                    delete nodeMap[nodeArray[i]];
                }
                prepareRelationContentField();
                loadGroupUnitOptions();
            }

        /*************************************************DEPENDENCY********************************************************/
            var dependencyManager = {};

            class ConstraintUnit {
                constructor(startArg, endArg, val_0, val_1) {
                    this.startpoint = startArg;
                    this.endpoint = endArg;
                    this.tag = this.startpoint + " -> " + this.endpoint;
                    this.name = this.startpoint + "_" + this.endpoint;
                    this.value_0 = val_0;
                    this.value_1 = val_1;
                }

                getConstraintStr() {
                    return '"' + this.startpoint + '"' + ' -> ' + '"' + this.endpoint + '"' + ' ' + this.value_0 + ' ' + this.value_1;
                }

                getConstraintTag() {
                    return this.tag;
                }

                getConstraintName() {
                    return this.name;
                }

                getStartPoint() {
                    return this.startpoint;
                }

                getEndPoint() {
                    return this.endpoint;
                }

                getValue0() {
                    return this.value_0;
                }
                
                getValue1() {
                    return this.value_1;
                }
            }

            function prepareDependencyContentField() {
                /*
                <div class="container">
                  <div class="row">
                    <ul class="list-group" id="constraintList">
                      <li class="list-group-item borderless"></li>
                      ...
                    </ul>
                  </div>
                </div>
                */
                var divDependencyField = document.getElementById("dependencyArrayContainer");
                divDependencyField.innerHTML = "";

                var divLayoutRow = document.createElement("div");
                divLayoutRow.className = "row";

                var ulListGroup = document.createElement("ul");
                ulListGroup.className = "list-group";

                var keyArray = Object.keys(dependencyManager);
                for (let count = 0; count < keyArray.length; count++) {
                    var constraint = dependencyManager[keyArray[count]];
                    var liListGroupItem = document.createElement("li");
                    liListGroupItem.className = "list-group-item borderless";
                    liListGroupItem.innerHTML = constraint.getConstraintStr();
                    ulListGroup.appendChild(liListGroupItem);
                }
                divLayoutRow.appendChild(ulListGroup);
                divDependencyField.appendChild(divLayoutRow);
            }


            function handleStartGroupSelect() {
                var startGroupOptionsSelect = document.getElementById('showStartGroupOptions');
                var startSubgroupOptionsSelect = document.getElementById('showStartSubgroupOptions');
                var startNodeOptionsSelect = document.getElementById('showStartNodeOptions');

                var selectedGroup = startGroupOptionsSelect.options[startGroupOptionsSelect.selectedIndex].text;
                var selectedSubgroup = startSubgroupOptionsSelect.options[startSubgroupOptionsSelect.selectedIndex].text;

                var nodeArray = relationManager[selectedGroup].getSubgroup(selectedSubgroup);
                startNodeOptionsSelect.innerHTML = "";
                for (let count = 0; count < nodeArray.length; count++) {
                    var optionNode = document.createElement('option');
                    optionNode.value = count;
                    optionNode.innerHTML = nodeArray[count];
                    startNodeOptionsSelect.append(optionNode);
                }
            }

            function handleEndGroupSelect() {
                var endGroupOptionsSelect = document.getElementById('showEndGroupOptions');
                var endSubgroupOptionsSelect = document.getElementById('showEndSubgroupOptions');
                var showEndNodeOptionsSelect = document.getElementById('showEndNodeOptions');

                var selectedGroup = endGroupOptionsSelect.options[endGroupOptionsSelect.selectedIndex].text;
                var selectedSubgroup = endSubgroupOptionsSelect.options[endSubgroupOptionsSelect.selectedIndex].text;

                var nodeArray = relationManager[selectedGroup].getSubgroup(selectedSubgroup);
                showEndNodeOptionsSelect.innerHTML = "";
                for (let count = 0; count < nodeArray.length; count++) {
                    var optionNode = document.createElement('option');
                    optionNode.value = count;
                    optionNode.innerHTML = nodeArray[count];
                    showEndNodeOptionsSelect.append(optionNode);
                }
            }

            function loadGroupUnitOptionsInDependency() {
                var startGroupOptionsSelect = document.getElementById('showStartGroupOptions');
                var endGroupOptionsSelect = document.getElementById('showEndGroupOptions');
                var keyArray = Object.keys(relationManager);

                startGroupOptionsSelect.innerHTML = "";
                endGroupOptionsSelect.innerHTML = "";

                if (keyArray.length > 0) {
                    for (let i = 0; i < keyArray.length; i++) {
                        var optionStartGroupUnit = document.createElement('option');
                        var optionEndGroupUnit = document.createElement('option');

                        optionStartGroupUnit.value = i;
                        optionStartGroupUnit.innerHTML = keyArray[i];
                        optionEndGroupUnit.value = i;
                        optionEndGroupUnit.innerHTML = keyArray[i];

                        startGroupOptionsSelect.appendChild(optionStartGroupUnit);
                        endGroupOptionsSelect.appendChild(optionEndGroupUnit);
                    }
                }

                startGroupOptionsSelect.addEventListener("change", handleStartGroupSelect);
                document.getElementById('showStartSubgroupOptions').addEventListener("change", handleStartGroupSelect);
                endGroupOptionsSelect.addEventListener("change", handleEndGroupSelect);
                document.getElementById('showEndSubgroupOptions').addEventListener("change", handleEndGroupSelect);

                startGroupOptionsSelect.options[0].selected = true;
                document.getElementById('showStartSubgroupOptions').options[0].selected = true;
                endGroupOptionsSelect.options[0].selected = true;
                document.getElementById('showEndSubgroupOptions').options[0].selected = true;
                handleStartGroupSelect();
                handleEndGroupSelect();
            }

            function loadConstraintUnit() {
                var constraintOptionsSelect = document.getElementById('showConstraintOptions');
                var keyArray = Object.keys(dependencyManager);
                constraintOptionsSelect.innerHTML = "";
                if (keyArray.length > 0) {
                    for (let i = 0; i < keyArray.length; i++) {
                        var optionConstraintUnit = document.createElement('option');
                        optionConstraintUnit.value = i;
                        optionConstraintUnit.innerHTML = keyArray[i];
                        constraintOptionsSelect.appendChild(optionConstraintUnit);
                    }
                }
            }

            function addConstraintUnit() {
                var startNodeOptionsSelect = document.getElementById('showStartNodeOptions');
                var endNodeOptionsSelect = document.getElementById('showEndNodeOptions');
                var constraintType0Radio = document.getElementsByName('flexRadioConstraint0');
                var constraintType1Radio = document.getElementsByName('flexRadioConstraint1');

                var startNode = startNodeOptionsSelect.options[startNodeOptionsSelect.selectedIndex].text;
                var endNode = endNodeOptionsSelect.options[endNodeOptionsSelect.selectedIndex].text;
                var constraintInput0 = document.getElementById('ConstraintInput0').value;
                var constraintInput1 = document.getElementById('ConstraintInput1').value;

                var constraintType0 = "";
                var constraintType1 = "";

                if(startNode == endNode){
                    alert("Invalid dependecy");//Is this allowed?
                    return;
                }

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

                var newConstraint = new ConstraintUnit(startNode, endNode, constraintInput0, constraintInput1);
                dependencyManager[newConstraint.getConstraintTag()] = newConstraint;

                prepareDependencyContentField();
                loadConstraintUnit();
            }

            function addConstriantForInnerNode(nodeArray) {
                if (nodeArray.length < 2) {
                    return;
                }
                var newConstraintArray = [];

                for (let count = 0; count < nodeArray.length - 1; count++) {
                    var newConstraint = new ConstraintUnit(nodeArray[count], nodeArray[count + 1], "1", "1");
                    dependencyManager[newConstraint.getConstraintTag()] = newConstraint;
                    newConstraintArray.push(newConstraint.getConstraintTag());
                }
                prepareDependencyContentField();
                loadConstraintUnit();
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
                prepareDependencyContentField();
                loadConstraintUnit();
            }

            function deleteConstraintUnit() {
                var targetConstraintOptionsSelect = document.getElementById('showConstraintOptions');
                var targetConstraint = targetConstraintOptionsSelect.options[targetConstraintOptionsSelect.selectedIndex].text;

                delete dependencyManager[targetConstraint];
                prepareDependencyContentField();
                loadConstraintUnit();
            }

            $(document).ready(function () {
                $('input[type="radio"]').click(function () {
                    var inputID = $(this).attr("id");
                    var index = inputID.charAt(inputID.length - 1);
                    var type = inputID.substring(0, inputID.length - 1);
                    if (type == "flexRadioNumber") {
                        $("#ConstraintInput" + index).show();
                    } else {
                        $("#ConstraintInput" + index).hide();
                    }
                });
            });
        /***************************************************Canvas**********************************************************/
        /* Description of mermaid API usage and binding events
        Click button DRAW, the render function in drawDiagram() will be called and graph1 will be generated.
        After generation the render function calls the provided callback function - insertSvg()
        The callback function is called with two parameters, the svg code of the generated graph and a function.
        This function binds events to the svg after it is inserted into the DOM. In this case an click event.
        If the click event is triggered, the graph2 will be generated in the same way for presentation.
        */
            var operatorNum = 1; 
            var linkNum = 1;
            var flowchartDataFormat = {
                operators: {
                    operator1: {
                        top: 20,
                        left: 20,
                        properties: {
                            title: 'Operator 1',
                            inputs: {},
                            outputs: {
                                output_1: {
                                    label: ' ',
                                }
                            }
                        }
                    },
                    operator2: {
                        top: 80,
                        left: 300,
                        properties: {
                            title: 'Operator 2',
                            inputs: {
                                input_1: {
                                    label: '1',
                                },
                                input_2: {
                                    label: '2',
                                },
                                input_3: {
                                    label: '3',
                                },
                                input_4: {
                                    label: '4',
                                },
                            },
                            outputs: {}
                        }
                    },
                },
                links: {
                    link_1: {
                        fromOperator: 'operator1',
                        fromConnector: 'output_1',
                        toOperator: 'operator2',
                        toConnector: 'input_2',
                    },
                }
            };

            var defaultFlowchartData = {
                operators: {},
                links: {}
            };

            function addLinkToFlowchartData(constraintArray) {
                //Todo: verify if nodes exist 
                for (let count = 0; count < constraintArray.length; count++) {
                    var constraintUnit = dependencyManager[constraintArray[count]];
                    var newLink = {
                        fromOperator: constraintUnit.getStartPoint(),
                        fromConnector: "output_1",
                        toOperator: constraintUnit.getEndPoint(),
                        toConnector: "input_1",
                    }
                    defaultFlowchartData.links[constraintUnit.getConstraintName()] = newLink;
                    linkNum++;
                }               
                updateGraphData();
            }

            function addOperatorToFlowchartData(nodeArray) {
                for (let count = 0; count < nodeArray.length; count++) {
                    var newOperator = {
                        top: operatorNum*40,
                        left: 50,
                        properties: {
                            title: nodeArray[count],
                            uncontained: true,
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
                    };
                    defaultFlowchartData.operators[nodeArray[count]] = newOperator;
                    operatorNum++;
                }
                updateGraphData();
            }
                

            function modifyOperator() {
                //user case: new link on a node
            }

            function updateGraphData() {
                $('#flowchartworkspace').flowchart('setData', defaultFlowchartData);
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
                    prepareCodeContentField();
                    initRelation();
                    prepareRelationContentField();
                    loadGroupUnitOptions();
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
