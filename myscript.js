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

    //-----------------------------------------
    //--- operator and link properties
    //--- start
    var $operatorProperties = $('#operator_properties');
    $operatorProperties.hide();
    var $linkProperties = $('#link_properties');
    $linkProperties.hide();

    var $operatorTitle = $('#operator_title');
    var $operatorGroup = $('#operator_group');

    var $linkTitle = $('#link_title');
    var $linkColor = $('#link_color');
    var $linkFrom = $('#link_from');
    var $linkTo = $('#link_to');

    $flowchart.flowchart({
        onOperatorSelect: function (operatorId) {
            $opGroupProperties.hide();
            $operatorProperties.show();
            var operatorInfos = $flowchart.flowchart('getOperatorInfos', operatorId);
            $operatorTitle.val(operatorInfos[0]);
            $operatorGroup.val(operatorInfos[1]);
            return true;
        },
        onOperatorUnselect: function () {
            $operatorProperties.hide();
            return true;
        },
        onOperatorMoved: function (operatorId, opData) {
            if (opData.properties.title == "ROOT" || opData.properties.title == opData.opGroup) {
                return true;
            }

            if (operatorId.startsWith("Op_") && nodeMap.hasOwnProperty(operatorId)) {
                var nodeUnit = nodeMap[operatorId];
                var parent = nodeUnit.getParent()
                if (parent != opData.opGroup) {
                    relationManager[parent].deleteNode(operatorId, nodeUnit.getSubgroup());
                    var groupUnitName_new = opData.opGroup.slice(0, -2);
                    relationManager[groupUnitName_new].appendNode(operatorId, "subgroup" + opData.opGroup.slice(-1));
                }
                nodeMap[operatorId].setOperatorData(opData);//TODO: more details in setOperatorData
            } else if (relationManager.hasOwnProperty(operatorId)){
                var groupUnit = relationManager[operatorId];
                var parentGroupUnit = groupUnit.getParentGroup();
                var subGroup = groupUnit.getParentSubGroup();
                if (parentGroupUnit != opData.opGroup.slice(0, -2) || subGroup != Number(opData.opGroup.slice(-1))) {
                    relationManager[parentGroupUnit].deleteNode(operatorId, "childGroup" + subGroup);
                    relationManager[opData.opGroup.slice(0, -2)].appendGroup(operatorId, "childGroup" + opData.opGroup.slice(-1));
                    relationManager[operatorId].setParentGroup(opData.opGroup.slice(0, -2), Number(opData.opGroup.slice(-1)));
                }
            }
        },
        onOperatorDelete: function (operatorId) {
            return true;
        },
        onLinkSelect: function (linkId) {
            $opGroupProperties.hide();
            $linkProperties.show();
            var linkInfos = $flowchart.flowchart('getLinkInfos', linkId);
            $linkTitle.val(linkId);
            $linkColor.val(linkInfos[0]);
            $linkFrom.val(linkInfos[1]);
            $linkTo.val(linkInfos[2]);

            $("#flexRadioPosINF0").attr('checked', false);
            $("#flexRadioNegINF0").attr('checked', false);
            $("#flexRadioNumber0").attr('checked', false);
            $("#flexRadioPosINF1").attr('checked', false);
            $("#flexRadioNegINF1").attr('checked', false);
            $("#flexRadioNumber1").attr('checked', false);

            
            if (linkInfos[3] == "+INF") {
                $("#flexRadioPosINF0").attr('checked', true);
            } else if (linkInfos[3] == "-INF") {
                $("#flexRadioNegINF0").attr('checked', true);
            } else {
                $("#flexRadioNumber0").attr('checked', true);
                $("#ConstraintInput0").val(linkInfos[3]);
            }
            
            if (linkInfos[4] == "+INF") {
                $("#flexRadioPosINF1").attr('checked', true);
            } else if (linkInfos[4] == "-INF") {
                $("#flexRadioNegINF1").attr('checked', true);
            } else {
                $("#flexRadioNumber1").attr('checked', true);
                $("#ConstraintInput1").val(linkInfos[4]);
            }

            return true;
        },
        onLinkUnselect: function () {
            $linkProperties.hide();
            return true;
        },
        onOpGroupDelete: function(opGroupId) {
            deleteOpGroup(opGroupId);
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
        dependencyManager[linkId].setConstraint(constraintInput0, constraintInput1);
    });
    //--- end
    //--- operator and link properties
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

    $('#create_opGroup').click(function () {
        if ($opGroupProperties.is(":hidden")) {
            $opGroupProperties.show();
            $operatorProperties.hide();
            $linkProperties.hide();
        } else {
            $opGroupProperties.hide();
        }
    });

    $('#setOpGroupInfos').click(function () {
        var groupUnitName = $opGroupTitle.val();
        var subGroup = $subGroup.options[$subGroup.selectedIndex].text;
        var parentGroup = $opGroupParent.options[$opGroupParent.selectedIndex].text;
        var parentSubGroup = $parentSubGroup.options[$parentSubGroup.selectedIndex].text;

        if (groupUnitName.length < 1) {
            alert("Please provide a valid name!");
            return;
        }

        createOpGroup(groupUnitName, subGroup, parentGroup, parentSubGroup);
        loadGroupUnitOptions();
        clearOpGroupInfos();
    });

    function createOpGroup(groupUnitName, subGroup, parentGroup, parentSubGroup) {
        var groupUnit = null;

        //"Op_xxxx" is reserved for node, cannot be used as group name
        if (groupUnitName.startsWith("Op_")) {
            alert("Group name is not allowed to start with 'Op_'!");
            return;
        }

        //Check if subGroup is already created. 
        if (groupUnitName in relationManager) {
            groupUnit = relationManager[groupUnitName];
            if (groupUnit.isOpGroupPainted(subGroup)) {
                alert(groupUnitName + "_" + subGroup + " exist!");
                return;
            }
        } else if (groupUnitName != "ROOT" && !relationManager[parentGroup].isOpGroupPainted(parentSubGroup)) {//check if parent exists
            alert("Invalid parent group " + parentGroup + "_" + parentSubGroup + " !");
            return;
        } else {//GroupX_1's parent group is set here when GroupX_0 is created
            groupUnit = new GroupUnit(groupUnitName);
            groupUnit.setParentGroup(parentGroup, parentSubGroup);
            relationManager[groupUnit.getGroupName()] = groupUnit;
            if (groupUnit.getGroupName() != "ROOT") {
                relationManager[parentGroup].appendGroup(groupUnit.getGroupName());
            }
        }
        
        var opGroupData = groupUnit.getOpGroupData(Number(subGroup));
        $flowchart.flowchart('createOpGroup', opGroupData.title, opGroupData);
        opGroupData.isPainted = true;
        groupUnit.setOpGroupData(Number(subGroup), opGroupData);

        loadGroupUnitOptions();
    }

    function clearOpGroupInfos() {
        $opGroupTitle.val('');
        $subGroup.selectedIndex = 0;
        $opGroupParent.selectedIndex = 0;
        $parentSubGroup.selectedIndex = 0;
    }

    function deleteOpGroup(opGroupId) {
        var groupUnitName = opGroupId.slice(0, -2);
        
        if (groupUnitName in relationManager) {
            var groupUnit = relationManager[groupUnitName];
            var subGroup = Number(opGroupId.slice(-1));
            var opGroupData = groupUnit.getOpGroupData(Number(subGroup));
            opGroupData.isPainted = false;
        }
    }

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
        }
    });

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

    function prepareInstructionInfo() {
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
        console.log("Working on line: " + textareaWl);
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
    /*
     *  relationManager:{
     *      groupUnitId:{
     *          opGroup0:{
     *              isPainted: false,
     *              title: groupUnitId + "_0",
     *              parent: null,
     *              childGroup: null,
     *              childNode: null,
     *              geometric: {
     *                  rect_x: 30,
     *                  rect_y: 80,
     *                  rect_width: 300,
     *                  rect_height: 500
     *              },
     *              headNode: {
                        top: 10,
                        left: 10,
                        opGroup: null,
                        properties: {
                            title: groupUnitId,
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
     *          },
     *          opGroup1:{
     *          
     *          },
     *      }
     *  }
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     * 
     *  nodeMap: {
     *      nodeId: {
     *          top: parentOpGroupData.geometric.top + 50,
     *          left: parentOpGroupData.geometric.left + 50,
     *          opGroup: parentOpGroupData.title,
     *          properties: {
     *              title: this.name,
     *              inputs: {
     *                  input_1: {
     *                      label: ' ',
     *                  },
     *              },
     *              outputs: {
     *                  output_1: {
     *                      label: ' ',
     *                  },
     *              }
     *          }
     *      }
     *  }
     * 
     */

    var relationManager = {};
    var nodeMap = {};

    function createGroupUnit(groupUnitId, parentId) {
        var groupUnitData = {
            opGroup0: {
                isPainted: false,
                title: groupUnitId + "_0",
                parent: parentId,
                childGroup: [],
                childNode: [],
                geometric: {
                    rect_x: 30,
                    rect_y: 80,
                    rect_width: 300,
                    rect_height: 500
                },
                headNode: {
                    top: 10,
                    left: 10,
                    opGroup: null,
                    properties: {
                        title: groupUnitId,
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
            opGroup1: {
                isPainted: false,
                title: groupUnitId + "_1",
                parent: parentId,
                childGroup: [],
                childNode: [],
                geometric: {
                    rect_x: 30,
                    rect_y: 80,
                    rect_width: 300,
                    rect_height: 500
                },
                headNode: {
                    top: 10,
                    left: 10,
                    opGroup: null,
                    properties: {
                        title: groupUnitId,
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
            }
        }

        relationManager[groupUnitId] = groupUnitData;
    }

    function updateOpGroup(opGroupId, opGroupData) {
        var groupUnitId = opGroupId.slice(0, -2);
        var subgroup = "opGroup" + opGroupId.slice(-1);
        relationManager[groupUnitId][subgroup] = opGroupData;
    }

    function deleteOpGroup_new(opGroupId) {
        var groupUnitId = opGroupId.slice(0, -2);
        var subgroup = "opGroup" + opGroupId.slice(-1);
        relationManager[groupUnitId][subgroup].isPainted = false;

        var removeAll = false;
        if (opGroupId.slice(-1) == "0" && relationManager[groupUnitId].opGroup1.isPainted == false) {
            removeAll = true;
        } else if(opGroupId.slice(-1) == "1" && relationManager[groupUnitId].opGroup0.isPainted == false) {
            removeAll = true;
        }

        if (removeAll) {
            delete relationManager[groupUnitId];
        }
    }

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
            }
        };

        nodeMap[nodeId] = nodeData;
    }

    function updateNodeData(nodeId, nodeData) {
        delete nodeData.internal;
        nodeMap[nodeId] = nodeData;
    }

    function deleteNodeData(nodeId) {
        delete nodeMap[nodeId];
    }

    class NodeUnit {
        constructor(nameArg, parentArg, subgroupArg) {
            this.name = nameArg;
            this.parent = parentArg;
            this.subgroup = subgroupArg;

            this.operatorData = {};
            this.initOperatorData();
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

        getName() {
            return this.name;
        }

        getParent() {
            return this.parent;
        }

        getSubgroup() {
            if (this.subgroup == 0)
                return "subgroup0";
            else
                return "subgroup1";
        }

        initOperatorData() {
            var parentOpGroupData = relationManager[this.parent].getOpGroupData(this.subgroup);
            this.operatorData = {
                top: parentOpGroupData.geometric.top + 50,
                left: parentOpGroupData.geometric.left + 50,
                opGroup: parentOpGroupData.title,
                properties: {
                    title: this.name,
                    uncontained: false,
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

        }

        getOperatorData() {
            return this.operatorData;
        }

        setOperatorData(newData) {
            this.operatorData = newData;
        }

    }

    class GroupUnit {
        constructor(nameArg) {
            this.name = nameArg;
            this.parentGroup = null;
            this.parentSubGroup = 0;
            this.childGroup0 = [];//child opGroup in opGroup0
            this.childGroup1 = [];//child opGroup in opGroup1 
            this.subgroup0 = [];//child node in opGroup0
            this.subgroup1 = [];//child node in opGroup1

            this.opGroupData0 = {
                isPainted: false,
                title: this.name + "_0",
                parent: null,
                childGroup: this.childGroup0,
                childNode: this.subgroup0,
                geometric: {
                    rect_x: 30,
                    rect_y: 80,
                    rect_width: 300,
                    rect_height: 500
                },
                headNode: {
                    top: 10,
                    left: 10,
                    opGroup: null,
                    properties: {
                        title: this.name,
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
                    opGroup: this.name + "_0",
                    properties: {
                        title: this.name + "_0",
                        inputs: {
                            input_1: {
                                label: ' ',
                            },
                        }
                    }
                }
            };

            this.opGroupData1 = {
                isPainted: false,
                title: this.name + "_1",
                parent: null,
                childGroup: this.childGroup1,
                childNode: this.subgroup1,
                geometric: {
                    rect_x: 30,
                    rect_y: 80,
                    rect_width: 300,
                    rect_height: 500
                },
                headNode: {
                    top: 10,
                    left: 10,
                    opGroup: null,
                    properties: {
                        title: this.name,
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
                    opGroup: this.name + "_1",
                    properties: {
                        title: this.name + "_1",
                        inputs: {
                            input_1: {
                                label: ' ',
                            },
                        }
                    }
                }
            };
        }

        getGroupName() {
            return this.name;
        }

        setParentGroup(parent, subGroup) {
            if (parent != null) {
                var parentTitle = parent + "_" + subGroup;
                this.opGroupData0.parent = parentTitle;
                this.opGroupData0.headNode.opGroup = parentTitle;
                this.opGroupData1.parent = parentTitle;
                this.opGroupData1.headNode.opGroup = parentTitle;
                this.parentGroup = parent;
                this.parentSubGroup = subGroup;
            } else {
                this.opGroupData0.parent = "ROOT_0";
                this.opGroupData0.headNode.opGroup = "ROOT_0";
                this.opGroupData1.parent = "ROOT_0";
                this.opGroupData1.headNode.opGroup = "ROOT_0";
                this.parentGroup = "ROOT";
                this.parentSubGroup = 0;
            }
        }

        getParentGroup() {
            return this.parentGroup;
        }

        getParentSubGroup() {
            return this.parentSubGroup;
        }

        getChildGroup0() {
            return this.childGroup0;
        }

        getChildGroup1() {
            return this.childGroup1;
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

        appendGroup(groupName, whereToAdd) {
            if (whereToAdd == "childGroup0") {
                this.childGroup0.push(groupName);
            } else if (whereToAdd == "childGroup1") {
                this.childGroup1.push(groupName);
            }
            
        }

        appendNode(nodeName, whereToAdd) {
            if (whereToAdd == "subgroup0") {
                this.subgroup0.push(nodeName);
            } else if (whereToAdd == "subgroup1") {
                this.subgroup1.push(nodeName);
            }
        }

        deleteNode(nodeName, whereToDelete) {
            if (whereToDelete == "childGroup0") {
                for (let count = 0; count < this.childGroup0.length; count++) {
                    if (nodeName == this.childGroup0[count]) {
                        this.childGroup0.splice(count, 1);
                        break;
                    }
                }
            } else if (whereToDelete == "childGroup1") {
                for (let count = 0; count < this.childGroup1.length; count++) {
                    if (nodeName == this.childGroup1[count]) {
                        this.childGroup1.splice(count, 1);
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

        isOpGroupPainted(subgroupNum) {
            if (subgroupNum == "0") {
                return this.opGroupData0.isPainted;
            } else if (subgroupNum == "1") {
                return this.opGroupData1.isPainted;
            }
        }

        setOpGroupData(subgroupNum, opGroupData) {
            if (subgroupNum == 0) {
                this.opGroupData0 = opGroupData;
            } else if (subgroupNum == 1) {
                this.opGroupData1 = opGroupData;
            }
        }

        getOpGroupData(subgroupNum) {
            if (subgroupNum == 0) {
                return this.opGroupData0;
            } else if (subgroupNum == 1) {
                return this.opGroupData1;
            }
        }
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
            nodeMap[nodeArray[count]] = new NodeUnit(nodeArray[count], "ROOT", 0);
            relationManager["ROOT"].appendNode(nodeArray[count], "subgroup0");
        }

        addOperatorToFlowchartData(nodeArray);
        addConstriantForInnerNode(nodeArray);
    }

    function deleteNodeAlongWithProgramLine(nodeArray) {
        for (let i = 0; i < nodeArray.length; i++) {
            var nodeUnit = nodeMap[nodeArray[i]];
            var parent = nodeUnit.getParent();
            var subgroup = nodeUnit.getSubgroup();
            relationManager[parent].deleteNode(nodeArray[i], subgroup);
            delete nodeMap[nodeArray[i]];
        }

        deleteOperatorFromFlowchart(nodeArray);
    }

    /*************************************************DEPENDENCY********************************************************/
    var dependencyManager = {};

    class ConstraintUnit {
        constructor(startArg, endArg, val_0, val_1) {
            this.startpoint = startArg; //fromOperator
            this.endpoint = endArg; //toOperator
            this.tag = this.startpoint + " -> " + this.endpoint;
            this.name = this.startpoint + "_" + this.endpoint; //linkId
            this.value_0 = val_0; //constraint_0
            this.value_1 = val_1; //constraint_1
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

        setConstraint(val_0, val_1) {
            this.value_0 = val_0;
            this.value_1 = val_1;
        }
    }
    
    function addConstriantForInnerNode(nodeArray) {
        if (nodeArray.length < 2) {
            return;
        }
        var newConstraintArray = [];

        for (let count = 0; count < nodeArray.length - 1; count++) {
            var newConstraint = new ConstraintUnit(nodeArray[count], nodeArray[count + 1], "0", "0");
            dependencyManager[newConstraint.getConstraintName()] = newConstraint;
            newConstraintArray.push(newConstraint.getConstraintName());
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
            $("#ConstraintInput" + index).show();
        } else {
            $("#ConstraintInput" + index).hide();
        }
    });
    /***************************************************Canvas**********************************************************/
    
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
            var newLinkId = constraintUnit.getConstraintName();
            var newLink = {
                fromOperator: constraintUnit.getStartPoint(),
                fromConnector: "output_1",
                toOperator: constraintUnit.getEndPoint(),
                toConnector: "input_1",
                constraint0: constraintUnit.getValue0(),
                constraint1: constraintUnit.getValue1(),
            }
            $('#flowchartworkspace').flowchart('createLink', newLinkId, newLink);
            linkNum++;
        }
    }

    function addOperatorToFlowchartData(nodeArray) {
        for (let count = 0; count < nodeArray.length; count++) {
            var newOperator = nodeMap[nodeArray[count]].getOperatorData();

            $('#flowchartworkspace').flowchart('createOperator', newOperator.properties.title, newOperator);
            operatorNum++;
        }
    }

    function deleteOperatorFromFlowchart(nodeArray) {
        //user case: new link on a node
        for (let count = 0; count < nodeArray.length; count++) {
            $('#flowchartworkspace').flowchart('deleteOperator', nodeArray[count]);
        }
    }

    function updateGraphData() {
        $('#flowchartworkspace').flowchart('setData', defaultFlowchartData);
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
            instrID = 1;
            textareaWl = 0;
            updateSpanWl(textareaWl);
            programManager = {}
            initCell();
            prepareCodeContentField();
            initRelation();
            document.getElementById("userInput").value = null;
            document.getElementById("editableFields").innerHTML = "";
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
