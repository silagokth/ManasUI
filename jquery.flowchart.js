if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            alert(this.innerHTML);
            this.parentNode.removeChild(this);

        }
    };
}

jQuery(function ($) {
// the widget definition, where "custom" is the namespace,
// "colorize" the widget name
    $.widget("flowchart.flowchart", {
        // default options
        options: {
            canUserEditLinks: true,
            canUserMoveOperators: true,
            data: {},
            distanceFromArrow: 3,
            defaultOperatorClass: 'flowchart-default-operator',

			// RGT
            linksLayerClass: 'flowchart-links-layer',
            operatorsLayerClass: 'flowchart-operators-layer',
            opGroupsLayerClass: 'flowchart-opGroups-layer',

			readOnly: false,
			// ---------------------------------------------------

			defaultLinkColor: '#000000',
            defaultSelectedLinkColor: '#3366ff',
            defaultOpGroupColor: 'black',
            //defaultSelectedOpGroupColor: '#3366ff',
            linkWidth: 10,
            grid: 20,
            multipleLinksOnOutput: false,
            multipleLinksOnInput: false,
            linkVerticalDecal: 0,
            verticalConnection: false,
            onOperatorCreate: function (operatorId, operatorData, fullElement) {
                return true;
            },
            onOperatorDelete: function (operatorId) {
                return true;
            },
            onOperatorSelect: function (operatorId) {
                return true;
            },
            onOperatorUnselect: function () {
                return true;
            },
            onOperatorMouseOver: function (operatorId) {
                return true;
            },
            onOperatorMouseOut: function (operatorId) {
                return true;
            },
            onOperatorMoved: function (operatorId, opData, destOpGrId) {
                return true;
            },
            onLinkCreate: function (linkId, linkData) {
                return true;
            },
            onLinkDelete: function (linkId, forced) {
                return true;
            },
            onLinkSelect: function (linkId) {
                return true;
            },
            onLinkUnselect: function () {
                return true;
            },
            onOpGroupCreate: function (opGroupId, opGroupData) {
                return true;
            },
            onOpGroupDelete: function (opGroupId) {
                return true;
            },
            onOpGroupSelect: function (opGroupId) {
                return true;
            },
            onOpGroupUnselect: function () {
                return true;
            },
            onAfterChange: function (changeType) {

            }
        },
        canvas: null,
        data: null,
        objs: null,
        maskNum: 0,
        linkNum: 0,
        operatorNum: 0,
        lastOutputConnectorClicked: null,
        selectedOperatorId: null,
        selectedLinkId: null,
        selectedOpGroupId: null,
        positionRatio: 1,
        globalId: null,
		
		// ---------------------------------------------------
		// RGT
		selectedOperators: [],
		// ---------------------------------------------------

        // the constructor
        _create: function () {
            if (typeof document.__flowchartNumber == 'undefined') {
                document.__flowchartNumber = 0;
            } else {
                document.__flowchartNumber++;
            }
            this.globalId = document.__flowchartNumber;
            this._initVariables();

            this.element.addClass('flowchart-container');

            if (this.options.verticalConnection) {
                this.element.addClass('flowchart-vertical');
            }

			this.canvas = this.element;

            this.objs.layers.links = $('<svg id="linksLayer" class="flowchart-links-layer"></svg>');
			// ---------------------------------------------------
			// RGT
			this.objs.layers.links.addClass(this.options.linksLayerClass);
			// ---------------------------------------------------
			this.objs.layers.links.appendTo(this.element);

            this.objs.layers.operators = $('<div id="operatorsLayer" class="flowchart-operators-layer unselectable"></div>');
			// ---------------------------------------------------
			// RGT
			this.objs.layers.operators.addClass(this.options.operatorsLayerClass);
			// ---------------------------------------------------
            this.objs.layers.operators.appendTo(this.element);

            this.objs.layers.temporaryLink = $('<svg class="flowchart-temporary-link-layer"></svg>');
			// ---------------------------------------------------
			// RGT
			this.objs.layers.temporaryLink.addClass(this.options.linksLayerClass);
            // ---------------------------------------------------
			this.objs.layers.temporaryLink.appendTo(this.element);

            var shape = document.createElementNS("http://www.w3.org/2000/svg", "line");
            shape.setAttribute("x1", "0");
            shape.setAttribute("y1", "0");
            shape.setAttribute("x2", "0");
            shape.setAttribute("y2", "0");
            shape.setAttribute("stroke-dasharray", "6,6");
            shape.setAttribute("stroke-width", "4");
            shape.setAttribute("stroke", "black");
            shape.setAttribute("fill", "none");
            this.objs.layers.temporaryLink[0].appendChild(shape);
            this.objs.temporaryLink = shape;

            //this.objs.layers.opGroups = $('<svg id="opGroupsLayer" class="flowchart-opGroups-layer"></svg>');
            this.objs.layers.opGroups = $('<div id="opGroupsLayer" class="flowchart-opGroups-layer unselectable"></div>');
            this.objs.layers.opGroups.addClass(this.options.opGroupsLayerClass);
            this.objs.layers.opGroups.appendTo(this.element);

            this._initEvents();

            if (typeof this.options.data != 'undefined') {
                this.setData(this.options.data);
            }
        },

        _initVariables: function () {
            this.data = {
                operators: {},
                links: {},
                opGroups: {}
            };
            this.objs = {
                layers: {
                    operators: null,
                    temporaryLink: null,
                    links: null,
                    opGroups: null
                },
                linksContext: null,
                temporaryLink: null
            };
        },

        _initEvents: function () {

            var self = this;

            this.element.mousemove(function (e) {
                var $this = $(this);
                var offset = $this.offset();
                self._mousemove((e.pageX - offset.left) / self.positionRatio, (e.pageY - offset.top) / self.positionRatio, e);
            });

            this.element.click(function (e) {
                var $this = $(this);
                var offset = $this.offset();
                self._click((e.pageX - offset.left) / self.positionRatio, (e.pageY - offset.top) / self.positionRatio, e);
            });

			// RGT
            this.element.on('scroll', function (e) {
                self.redrawLinksLayer();
            });
			// ---------------------------------------------------

            this.objs.layers.operators.on('pointerdown mousedown touchstart', '.flowchart-operator', function (e) {
               e.stopImmediatePropagation();
            });

            this.objs.layers.operators.on('mouseover', '.flowchart-operator', function (e) {
                self._operatorMouseOver($(this).data('operator_id'));
            });

            this.objs.layers.operators.on('mouseout', '.flowchart-operator', function (e) {
                self._operatorMouseOut($(this).data('operator_id'));
            });

            this.objs.layers.operators.on('click', '.flowchart-operator', function (e) {
                if ($(e.target).closest('.flowchart-operator-connector').length == 0) {
                    self.selectOperator($(this).data('operator_id'));
                }
            });

            this.objs.layers.operators.on('click', '.flowchart-operator-connector', function () {
                var $this = $(this);
                if (self.options.canUserEditLinks) {
                    self._connectorClicked($this.closest('.flowchart-operator').data('operator_id'), $this.data('connector'), $this.data('sub_connector'), $this.closest('.flowchart-operator-connector-set').data('connector_type'));
                }
            });

            this.objs.layers.links.on('pointerdown mousedown touchstart', '.flowchart-link', function (e) {
                e.stopImmediatePropagation();
            });

            this.objs.layers.links.on('mouseover', '.flowchart-link', function () {
                self._connecterMouseOver($(this).data('link_id'));
            });

			this.objs.layers.links.on('mouseout', '.flowchart-link', function () {
                self._connecterMouseOut($(this).data('link_id'));
            });

			this.objs.layers.links.on('click', '.flowchart-link', function () {
                self.selectLink($(this).data('link_id'));
            });
                        
            this.objs.layers.opGroups.on('mouseover', '.flowchart-opGroup', function () {
                self._opGroupMouseOver($(this).data('opGroup_id'));
            });

            this.objs.layers.opGroups.on('mouseout', '.flowchart-opGroup', function () {
                self._opGroupMouseOut($(this).data('opGroup_id'));
            });

            this.objs.layers.opGroups.on('click', '.flowchart-opGroup', function () {
                self.selectOpGroup($(this).data('opGroup_id'));
            });
            
        },

        setData: function (data) {
            this._clearOperatorsLayer();
            this._clearOpGroupsLayer();

            this.data.operatorTypes = {};
            if (typeof data.operatorTypes != 'undefined') {
                this.data.operatorTypes = data.operatorTypes;
            }

            this.data.opGroups = {};
            for (var opGroupId in data.opGroups) {
                if (data.opGroups.hasOwnProperty(opGroupId)) {
                    this.createOpGroup(opGroupId, data.opGroups[opGroupId]);
                }
            }
            this.data.operators = {};
            for (var operatorId in data.operators) {
                if (data.operators.hasOwnProperty(operatorId)) {
                    this.createOperator(operatorId, data.operators[operatorId]);
                }
            }
            this.data.links = {};
            for (var linkId in data.links) {
                if (data.links.hasOwnProperty(linkId)) {
                    this.createLink(linkId, data.links[linkId]);
                }
            }
            this.redrawLinksLayer();
        },

		// ---------------------------------------------------
		// RGT
		clearCanvas: function () {
            this._clearOperatorsLayer();
			this._clearLinksLayer();
            this.data.operatorTypes = {};
            this.data.links = {};
            this.data.operators = {};
            this.redrawLinksLayer();
			// Scroll to the top and left...
			this.canvas.scrollTop(0);
			this.canvas.scrollLeft(0);
			this.options.readOnly = false;
		},

		setToReadOnly: function (value) {
			this.options.readOnly = value;
			this.options.canUserEditLinks = !value;
		},

		getReadOnly: function () {
			return this.options.readOnly;
		},

		setSelectedOperators: function (selectedOperators) {
			this.selectedOperators = selectedOperators;
		},
		// ---------------------------------------------------

        addLink: function (linkData) {
            while (typeof this.data.links[this.linkNum] != 'undefined') {
                this.linkNum++;
            }

            this.createLink(this.linkNum, linkData);
            return this.linkNum;
        },

        createLink: function (linkId, linkDataOriginal) {
            var linkData = $.extend(true, {}, linkDataOriginal);
            if (!this.callbackEvent('linkCreate', [linkId, linkData])) {
                return;
            }

            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];

            var multipleLinksOnOutput = this.options.multipleLinksOnOutput;
            var multipleLinksOnInput = this.options.multipleLinksOnInput;
            if (!multipleLinksOnOutput || !multipleLinksOnInput) {
                for (var linkId2 in this.data.links) {
                    if (this.data.links.hasOwnProperty(linkId2)) {
                        var currentLink = this.data.links[linkId2];

                        var currentSubConnectors = this._getSubConnectors(currentLink);
                        var currentFromSubConnector = currentSubConnectors[0];
                        var currentToSubConnector = currentSubConnectors[1];

                        if (!multipleLinksOnOutput && !this.data.operators[linkData.fromOperator].properties.outputs[linkData.fromConnector].multipleLinks && currentLink.fromOperator == linkData.fromOperator && currentLink.fromConnector == linkData.fromConnector && currentFromSubConnector == fromSubConnector) {
                            this.deleteLink(linkId2);
                            continue;
                        }
                        if (!multipleLinksOnInput && !this.data.operators[linkData.toOperator].properties.inputs[linkData.toConnector].multipleLinks && currentLink.toOperator == linkData.toOperator && currentLink.toConnector == linkData.toConnector && currentToSubConnector == toSubConnector) {
                            this.deleteLink(linkId2);
                        }
                    }
                }
            }

            this._autoCreateSubConnector(linkData.fromOperator, linkData.fromConnector, 'outputs', fromSubConnector);
            this._autoCreateSubConnector(linkData.toOperator, linkData.toConnector, 'inputs', toSubConnector);

            this.data.links[linkId] = linkData;
            this._drawLink(linkId);

            this.callbackEvent('afterChange', ['link_create']);
        },

        _autoCreateSubConnector: function (operator, connector, connectorType, subConnector) {
            var connectorInfos = this.data.operators[operator].internal.properties[connectorType][connector];
            if (connectorInfos.multiple) {
                var fromFullElement = this.data.operators[operator].internal.els;
                var nbFromConnectors = this.data.operators[operator].internal.els.connectors[connector].length;
                for (var i = nbFromConnectors; i < subConnector + 2; i++) {
                    this._createSubConnector(connector, connectorInfos, fromFullElement);
                }
            }
        },

        _refreshOperatorConnectors: function (operatorId) {
            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if (linkData.fromOperator == operatorId || linkData.toOperator == operatorId)
                    {
                        var subConnectors = this._getSubConnectors(linkData);
                        var fromSubConnector = subConnectors[0];
                        var toSubConnector = subConnectors[1];

                        this._autoCreateSubConnector(linkData.fromOperator, linkData.fromConnector, 'outputs', fromSubConnector);
                        this._autoCreateSubConnector(linkData.toOperator, linkData.toConnector, 'inputs', toSubConnector);
                    }
                }
            }
        },

        redrawLinksLayer: function () {
            this._clearLinksLayer();
            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    this._drawLink(linkId);
                }
            }
        },

        _clearLinksLayer: function () {
            this.objs.layers.links.empty();
            if (this.options.verticalConnection) {
                this.objs.layers.operators.find('.flowchart-operator-connector-small-arrow').css('border-top-color', 'transparent');
            } else {
                this.objs.layers.operators.find('.flowchart-operator-connector-small-arrow').css('border-left-color', 'transparent');
            }
        },

        _clearOperatorsLayer: function () {
            this.objs.layers.operators.empty();
        },

        _clearOpGroupsLayer: function () {
            this.objs.layers.opGroups.empty();
        },

        getConnectorPosition: function (operatorId, connectorId, subConnector) {
            var operatorData = this.data.operators[operatorId];
            var $connector = operatorData.internal.els.connectorArrows[connectorId][subConnector];

            var connectorOffset = $connector.offset();
            var elementOffset = this.element.offset();
            var x = (connectorOffset.left - elementOffset.left) / this.positionRatio;
            var width = parseInt($connector.css('border-top-width'), 10);
            var y = (connectorOffset.top - elementOffset.top - 1) / this.positionRatio + parseInt($connector.css('border-left-width'), 10);

            return {x: x, width: width, y: y};
        },

        getLinkInfos: function (linkId) {
            var color = this.getLinkMainColor(linkId);
            var linkData = this.data.links[linkId];
            return [color, linkData.fromOperator, linkData.toOperator, linkData.constraint0, linkData.constraint1];
        },

        setLinkConstraint: function (linkId, constraintInput0, constraintInput1) {
            var linkData = this.data.links[linkId];
            linkData.constraint0 = constraintInput0;
            linkData.constraint1 = constraintInput1;
            linkData.internal.els.text.innerHTML = "[" + linkData.constraint0 + "," + linkData.constraint1 + "]";
        },

        getLinkMainColor: function (linkId) {
            var color = this.options.defaultLinkColor;
            var linkData = this.data.links[linkId];
            if (typeof linkData.color != 'undefined') {
                color = linkData.color;
            }
            return color;
        },

        setLinkMainColor: function (linkId, color) {
            this.data.links[linkId].color = color;
            this.callbackEvent('afterChange', ['link_change_main_color']);
        },

        _drawLink: function (linkId) {
            var linkData = this.data.links[linkId];

            if (typeof linkData.internal == 'undefined') {
                linkData.internal = {};
            }
            linkData.internal.els = {};

            var fromOperatorId = linkData.fromOperator;
            var fromConnectorId = linkData.fromConnector;
            var toOperatorId = linkData.toOperator;
            var toConnectorId = linkData.toConnector;

            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];

            var color = this.getLinkMainColor(linkId);

            var fromOperator = this.data.operators[fromOperatorId];
            var toOperator = this.data.operators[toOperatorId];

            var fromSmallConnector = fromOperator.internal.els.connectorSmallArrows[fromConnectorId][fromSubConnector];
            var toSmallConnector = toOperator.internal.els.connectorSmallArrows[toConnectorId][toSubConnector];

            linkData.internal.els.fromSmallConnector = fromSmallConnector;
            linkData.internal.els.toSmallConnector = toSmallConnector;

            var overallGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.objs.layers.links[0].appendChild(overallGroup);
            linkData.internal.els.overallGroup = overallGroup;

            var mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
            var maskId = "fc_mask_" + this.globalId + "_" + this.maskNum;
            this.maskNum++;
            mask.setAttribute("id", maskId);

            overallGroup.appendChild(mask);

            var shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            shape.setAttribute("x", "0");
            shape.setAttribute("y", "0");
            shape.setAttribute("width", "100%");
            shape.setAttribute("height", "100%");
            shape.setAttribute("stroke", "none");
            shape.setAttribute("fill", "white");
            mask.appendChild(shape);

            var shape_polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            shape_polygon.setAttribute("stroke", "none");
            shape_polygon.setAttribute("fill", "black");
            mask.appendChild(shape_polygon);
            linkData.internal.els.mask = shape_polygon;

            var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.setAttribute('class', 'flowchart-link');
            group.setAttribute('data-link_id', linkId);
            overallGroup.appendChild(group);

            var shape_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            if (!linkId.startsWith("Op_")) {
                shape_path.setAttribute("stroke-dasharray", "4,4");
            }
            shape_path.setAttribute("stroke-width", this.options.linkWidth.toString());
            shape_path.setAttribute("fill", "none");
            group.appendChild(shape_path);
            linkData.internal.els.path = shape_path;

            var shape_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            shape_rect.setAttribute("stroke", "none");
            shape_rect.setAttribute("mask", "url(#" + maskId + ")");
            group.appendChild(shape_rect);
            linkData.internal.els.rect = shape_rect;

            var shape_text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            shape_text.setAttribute("fill", "black");
            group.appendChild(shape_text);
            linkData.internal.els.text = shape_text;


            this._refreshLinkPositions(linkId);
            this.uncolorizeLink(linkId);
        },

        _getSubConnectors: function (linkData) {
            var fromSubConnector = 0;
            if (typeof linkData.fromSubConnector != 'undefined') {
                fromSubConnector = linkData.fromSubConnector;
            }

            var toSubConnector = 0;
            if (typeof linkData.toSubConnector != 'undefined') {
                toSubConnector = linkData.toSubConnector;
            }

            return [fromSubConnector, toSubConnector];
        },

        refreshLinkPositionsByOperatorId: function (operatorId) {
            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if (linkData.fromOperator == operatorId || linkData.toOperator == operatorId) {
                        this._refreshLinkPositions(linkId);
                    }
                }
            }
        },

        _refreshLinkPositions: function (linkId) {
            var linkData = this.data.links[linkId];

            var subConnectors = this._getSubConnectors(linkData);
            var fromSubConnector = subConnectors[0];
            var toSubConnector = subConnectors[1];

            var fromPosition = this.getConnectorPosition(linkData.fromOperator, linkData.fromConnector, fromSubConnector);
            var toPosition = this.getConnectorPosition(linkData.toOperator, linkData.toConnector, toSubConnector);

			// RGT
			var xScroll = this.canvas.scrollLeft() / this.positionRatio;
			fromPosition.x += xScroll;
			toPosition.x += xScroll;
			var yScroll = this.canvas.scrollTop() / this.positionRatio;
			fromPosition.y += yScroll;
			toPosition.y += yScroll;
			// ---------------------------------------------------

            var fromX = fromPosition.x;
            var offsetFromX = fromPosition.width;
            var fromY = fromPosition.y;

            var toX = toPosition.x;
            var toY = toPosition.y;

            fromY += this.options.linkVerticalDecal;
            toY += this.options.linkVerticalDecal;

            var distanceFromArrow = this.options.distanceFromArrow;

            linkData.internal.els.mask.setAttribute("points", fromX + ',' + (fromY - offsetFromX - distanceFromArrow) + ' ' + (fromX + offsetFromX + distanceFromArrow) + ',' + fromY + ' ' + fromX + ',' + (fromY + offsetFromX + distanceFromArrow));

            var bezierFromX, bezierToX, bezierIntensity;

            if (this.options.verticalConnection) {
                fromY = fromY - 10;
                toY = toY - 10;
                bezierFromX = (fromX + offsetFromX + distanceFromArrow - 3);
                bezierToX = (toX + offsetFromX + distanceFromArrow - 3);

                bezierIntensity = Math.min(100, Math.max(Math.abs(bezierFromX - bezierToX) / 2, Math.abs(fromY - toY)));
                linkData.internal.els.path.setAttribute("d", 'M' + bezierFromX + ',' + (fromY) + ' C' + bezierFromX + ',' + (fromY + bezierIntensity) + ' ' + bezierToX + ',' + (toY - bezierIntensity) + ' ' + bezierToX + ',' + toY);
                linkData.internal.els.rect.setAttribute("x", fromX - 1 + this.options.linkWidth / 2);
                linkData.internal.els.text.setAttribute("x", (fromX + toX) / 2 + 10);
                linkData.internal.els.text.setAttribute("y", (fromY + toY) / 2 + 10);
                if (linkData.constraint0 != null && linkData.constraint1 != null) {
                    linkData.internal.els.text.innerHTML = "[" + linkData.constraint0 + "," + linkData.constraint1 + "]";
                }
            } else {
                bezierFromX = (fromX + offsetFromX + distanceFromArrow);
                bezierToX = toX + 1;
                bezierIntensity = Math.min(100, Math.max(Math.abs(bezierFromX - bezierToX) / 2, Math.abs(fromY - toY)));
                linkData.internal.els.path.setAttribute("d", 'M' + bezierFromX + ',' + (fromY) + ' C' + (fromX + offsetFromX + distanceFromArrow + bezierIntensity) + ',' + fromY + ' ' + (toX - bezierIntensity) + ',' + toY + ' ' + bezierToX + ',' + toY);
                linkData.internal.els.rect.setAttribute("x", fromX);
                linkData.internal.els.text.setAttribute("x", (fromX + toX) / 2 + 10);
                linkData.internal.els.text.setAttribute("y", (fromY + toY) / 2 + 10);
                if (linkData.constraint0 != null && linkData.constraint1 != null) {
                    linkData.internal.els.text.innerHTML = "[" + linkData.constraint0 + "," + linkData.constraint1 + "]";
                }
            }

            linkData.internal.els.rect.setAttribute("y", fromY - this.options.linkWidth / 2);
			linkData.internal.els.rect.setAttribute("width", offsetFromX + distanceFromArrow + 1);
            linkData.internal.els.rect.setAttribute("height", this.options.linkWidth);
        },

        getOperatorCompleteData: function (operatorData) {
            if (typeof operatorData.internal == 'undefined') {
                operatorData.internal = {};
            }
            this._refreshInternalProperties(operatorData);
            var infos = $.extend(true, {}, operatorData.internal.properties);

            for (var connectorId_i in infos.inputs) {
                if (infos.inputs.hasOwnProperty(connectorId_i)) {
                    if (infos.inputs[connectorId_i] == null) {
                        delete infos.inputs[connectorId_i];
                    }
                }
            }

            for (var connectorId_o in infos.outputs) {
                if (infos.outputs.hasOwnProperty(connectorId_o)) {
                    if (infos.outputs[connectorId_o] == null) {
                        delete infos.outputs[connectorId_o];
                    }
                }
            }
            if (typeof infos.class == 'undefined') {
                infos.class = this.options.defaultOperatorClass;
            }
            return infos;
        },

        _getOperatorFullElement: function (operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);

            var $operator = $('<div class="flowchart-operator"></div>');
            $operator.addClass(infos.class);

            var $operator_title = $('<div class="flowchart-operator-title"></div>');
            $operator_title.html(infos.title);
            $operator_title.appendTo($operator);

            var $operator_body = $('<div class="flowchart-operator-body"></div>');
            $operator_body.html(infos.body);
            if (infos.body) {
                $operator_body.appendTo($operator);
            }

            var $operator_inputs_outputs = $('<div class="flowchart-operator-inputs-outputs"></div>');

            var $operator_inputs = $('<div class="flowchart-operator-inputs"></div>');

            var $operator_outputs = $('<div class="flowchart-operator-outputs"></div>');

            if (this.options.verticalConnection) {
                $operator_inputs.prependTo($operator);
                $operator_outputs.appendTo($operator);
            } else {
                $operator_inputs_outputs.appendTo($operator);
                $operator_inputs.appendTo($operator_inputs_outputs);
                $operator_outputs.appendTo($operator_inputs_outputs);
            }

            var self = this;

            var connectorArrows = {};
            var connectorSmallArrows = {};
            var connectorSets = {};
            var connectors = {};

            var fullElement = {
                operator: $operator,
                title: $operator_title,
                body: $operator_body,
                connectorSets: connectorSets,
                connectors: connectors,
                connectorArrows: connectorArrows,
                connectorSmallArrows: connectorSmallArrows
            };

            function addConnector(connectorKey, connectorInfos, $operator_container, connectorType) {
                var $operator_connector_set = $('<div class="flowchart-operator-connector-set"></div>');
                $operator_connector_set.data('connector_type', connectorType);
                $operator_connector_set.appendTo($operator_container);

                connectorArrows[connectorKey] = [];
                connectorSmallArrows[connectorKey] = [];
                connectors[connectorKey] = [];
                connectorSets[connectorKey] = $operator_connector_set;

                if ($.isArray(connectorInfos.label)) {
                    for (var i = 0; i < connectorInfos.label.length; i++) {
                        self._createSubConnector(connectorKey, connectorInfos.label[i], fullElement);
                    }
                } else {
                    self._createSubConnector(connectorKey, connectorInfos, fullElement);
                }
            }

            for (var key_i in infos.inputs) {
                if (infos.inputs.hasOwnProperty(key_i)) {
                    addConnector(key_i, infos.inputs[key_i], $operator_inputs, 'inputs');
                }
            }

            for (var key_o in infos.outputs) {
                if (infos.outputs.hasOwnProperty(key_o)) {
                    addConnector(key_o, infos.outputs[key_o], $operator_outputs, 'outputs');
                }
            }
            //console.log(fullElement);
            return fullElement;
        },

        _createSubConnector: function (connectorKey, connectorInfos, fullElement) {
            var $operator_connector_set = fullElement.connectorSets[connectorKey];

            var subConnector = fullElement.connectors[connectorKey].length;

            var $operator_connector = $('<div class="flowchart-operator-connector"></div>');
            $operator_connector.appendTo($operator_connector_set);
            $operator_connector.data('connector', connectorKey);
            $operator_connector.data('sub_connector', subConnector);

            var $operator_connector_label = $('<div class="flowchart-operator-connector-label"></div>');
            $operator_connector_label.text(connectorInfos.label.replace('(:i)', subConnector + 1));
            $operator_connector_label.appendTo($operator_connector);

            var $operator_connector_arrow = $('<div class="flowchart-operator-connector-arrow"></div>');

            $operator_connector_arrow.appendTo($operator_connector);

            var $operator_connector_small_arrow = $('<div class="flowchart-operator-connector-small-arrow"></div>');
            $operator_connector_small_arrow.appendTo($operator_connector);

            fullElement.connectors[connectorKey].push($operator_connector);
            fullElement.connectorArrows[connectorKey].push($operator_connector_arrow);
            fullElement.connectorSmallArrows[connectorKey].push($operator_connector_small_arrow);
        },

        getOperatorElement: function (operatorData) {
            var fullElement = this._getOperatorFullElement(operatorData);
            return fullElement.operator;
        },

        addOperator: function (operatorData) {
            //console.log(this.data.operators);
            while (typeof this.data.operators[this.operatorNum] != 'undefined') {
                this.operatorNum++;
            }

            this.createOperator(this.operatorNum, operatorData);
            return this.operatorNum;
        },

        
        resizeCanvas: function () {
            var mostBottomOperatorTop = 0;
            var mostRightOperatorLeft = 0;

            for (var opId in this.data.operators) {
                var opData = this.data.operators[opId];
                mostBottomOperatorTop = opData.top > mostBottomOperatorTop ? opData.top : mostBottomOperatorTop;
                mostRightOperatorLeft = opData.left > mostRightOperatorLeft ? opData.left : mostRightOperatorLeft;
            }

            var newHeight = mostBottomOperatorTop + parseFloat(this.data.operators['ROOT'].internal.els.operator.css('height'));
            var newWidth = mostRightOperatorLeft + parseFloat(this.data.operators['ROOT'].internal.els.operator.css('width'));

            var rootOpGroup = this.data.opGroups["ROOT_0"];
            var opGroupBottom = rootOpGroup.geometric.rect_y + rootOpGroup.geometric.rect_height;
            var opGroupRight = rootOpGroup.geometric.rect_x + rootOpGroup.geometric.rect_width;

            if (this.data.opGroups["ROOT_1"] != null) {
                rootOpGroup = this.data.opGroups["ROOT_1"];
                var root1_bottom = rootOpGroup.geometric.rect_y + rootOpGroup.geometric.rect_height;
                var root1_right = rootOpGroup.geometric.rect_x + rootOpGroup.geometric.rect_width;
                opGroupBottom = root1_bottom > opGroupBottom ? root1_bottom : opGroupBottom;
                opGroupRight = root1_right > opGroupRight ? root1_right : opGroupRight;
            }

            newHeight = newHeight > opGroupBottom ? newHeight : opGroupBottom;
            newWidth = newWidth > opGroupRight ? newWidth : opGroupRight;

            var minHeight = $('#flowchartwindow').height();
            var minWidth = $('#flowchartwindow').width();
            var currentHight = parseFloat($('.flowchart-container').css('height'));
            var currentWidth = parseFloat($('.flowchart-container').css('width'));

            newHeight = newHeight + 300;
            newWidth = newWidth + 300;

            if (newWidth > minWidth) {
                $('.flowchart-container').css('width', newWidth);
                $('.flowchart-operators-layer').css('width', newWidth);
                $('.flowchart-links-layer').css('width', newWidth);
                $('.flowchart-opGroups-layer').css('width', newWidth);
            } else if (currentWidth != minWidth) {
                newWidth = minWidth;
                $('.flowchart-container').css('width', newWidth);
                $('.flowchart-operators-layer').css('width', newWidth);
                $('.flowchart-links-layer').css('width', newWidth);
                $('.flowchart-opGroups-layer').css('width', newWidth);
            }

            if (newHeight > minHeight) {
                $('.flowchart-container').css('height', newHeight);
                $('.flowchart-operators-layer').css('height', newHeight);
                $('.flowchart-links-layer').css('height', newHeight);
                $('.flowchart-opGroups-layer').css('height', newHeight);
            } else if (currentHight != minHeight) {
                newHeight = minHeight;
                $('.flowchart-container').css('height', newHeight);
                $('.flowchart-operators-layer').css('height', newHeight);
                $('.flowchart-links-layer').css('height', newHeight);
                $('.flowchart-opGroups-layer').css('height', newHeight);
            }
        },

        createOperator: function (operatorId, operatorDataOriginal) {
            var operatorData = $.extend(true, {}, operatorDataOriginal);
            operatorData.internal = {};
            this._refreshInternalProperties(operatorData);

            var fullElement = this._getOperatorFullElement(operatorData);
            if (!this.callbackEvent('operatorCreate', [operatorId, operatorData, fullElement])) {
                return false;
            }

            //place operator into parentSubgroup
            /*
                                ROOT                      LOOPb (whose parent is LOOPa)            
            headNode   "ROOT".opGroup: "ROOT_0"          "LOOPb".opGroup: "LOOPa_0"
            entry      "ROOT_0".opGroup: "ROOT_0"        "LOOPb_0".opGroup: "LOOPb_0"
            All headNodes and entries don't need to be relocated. 
            */
            if (operatorData.properties.title == operatorData.opGroup) {
                //make entry node a bit different
                fullElement.title.addClass('flowchart-operator-entry');
            }

            var parentOpGroup = this.data.opGroups[operatorData.opGroup];

            if (operatorData.properties.title != "ROOT") {
                parentOpGroup.childNode.push(operatorId);
            }

            if (operatorData.properties.title.startsWith("Op_")) {
                var opGroupTop = parseInt(parentOpGroup.internal.els.rect.css('top'));
                var opGroupLeft = parseInt(parentOpGroup.internal.els.rect.css('left'));
                operatorData.top = opGroupTop + 100;
                operatorData.left = opGroupLeft + 100;
            }

            var grid = this.options.grid;

            if (grid) {
                operatorData.top = Math.round(operatorData.top / grid) * grid;
                operatorData.left = Math.round(operatorData.left / grid) * grid;
            }
			// ---------------------------------------------------
			// RGT
			var xScroll = this.element.scrollLeft() / this.positionRatio;
			var yScroll = this.element.scrollTop() / this.positionRatio;
			operatorData.left += xScroll;
			operatorData.top += yScroll;
			// ---------------------------------------------------
			fullElement.operator.appendTo(this.objs.layers.operators);
            fullElement.operator.css({top: operatorData.top, left: operatorData.left});
            fullElement.operator.data('operator_id', operatorId);

            this.data.operators[operatorId] = operatorData;
            this.data.operators[operatorId].internal.els = fullElement;

            console.log("New operator:");
            console.log(this.data.operators[operatorId]);
            if (operatorId == this.selectedOperatorId) {
                this._addSelectedClass(operatorId);
            }

            var self = this;
            var pointerX;
            var pointerY;

            function operatorChangedPosition(operator_id, pos, isStopped) {
                operatorData.top = pos.top;
                operatorData.left = pos.left;

                self.resizeCanvas();
                self.refreshLinkPositionsByOperatorId(operator_id);

                //change opGroup
                if (!isStopped || operatorData.properties.title == "ROOT" || operatorData.properties.title == operatorData.opGroup) {
                    //do nothing before movement is stopped or ROOT node is moved or entry node is moved
                    return null;
                }

                //operator or headnode is moved 
                var destOpGrId = null;
                var destOpGrWidth = parseFloat($('.flowchart-container').css('width'));
                var destOpGrHeight = parseFloat($('.flowchart-container').css('height'));
                var opWidth = parseInt(operatorData.internal.els.operator.css('width'));
                var opHeight = parseInt(operatorData.internal.els.operator.css('height'));
                for (var opGrId in self.data.opGroups) {
                    var opGrData = self.data.opGroups[opGrId];
                    if (opGrData.geometric.rect_x < operatorData.left
                        && opGrData.geometric.rect_y < operatorData.top
                        && (opGrData.geometric.rect_x + opGrData.geometric.rect_width) > (operatorData.left + opWidth)
                        && (opGrData.geometric.rect_y + opGrData.geometric.rect_height) > (operatorData.top + opHeight)
                        && opGrData.geometric.rect_width < destOpGrWidth//to avoid the parent group of [destOpGrId]
                        && opGrData.geometric.rect_height < destOpGrHeight) {
                        destOpGrId = opGrId;
                        destOpGrWidth = opGrData.geometric.rect_width;
                        destOpGrHeight = opGrData.geometric.rect_height;
                    }
                }

                if (destOpGrId != null && (operatorData.opGroup == destOpGrId || operator_id == destOpGrId.slice(0, -2))) {
                    //it is moved within the same group
                    return null;
                }

                //remove the operator from parent group
                self.removeOperatorFromParentList(operator_id);
                operatorData.opGroup = "";
                operatorData.internal.els.operator.addClass("noGroup");

                //check if the operator is a headnode
                if (!operatorData.properties.title.startsWith("Op_")) {
                    //remove subgroup from their parent group
                    var opGr_0 = self.data.opGroups[operatorData.properties.title + "_0"];
                    self.removeOpGroupFromParentList(opGr_0.title);
                    opGr_0.parent = "";
                    opGr_0.internal.els.rect.addClass("noGroup");
                    

                    var opGr_1 = self.data.opGroups[operatorData.properties.title + "_1"];
                    if (typeof (opGr_1) != "undefined") {
                        self.removeOpGroupFromParentList(opGr_1.title);
                        opGr_1.parent = "";
                        opGr_1.internal.els.rect.addClass("noGroup");
                    }
                }

                //check if destOpId is valid
                if (destOpGrId == null) {
                    return { dest: "noGroup" };
                }

                if (!operatorData.properties.title.startsWith("Op_")) {
                    var dialogText = "Move headnode " + operator_id + " together with its subgroup " + opGr_0.title + " to group " + destOpGrId + "?";

                    if (typeof (opGr_1) != "undefined") {
                        dialogText = "Move headnode " + operator_id + " together with its subgroups " + opGr_0.title + " and " + opGr_1.title + " to group " + destOpGrId + "?";
                    }

                    if (confirm(dialogText)) {
                        operatorData.opGroup = destOpGrId;
                        self.data.opGroups[destOpGrId].childNode.push(operator_id);
                        operatorData.internal.els.operator.removeClass("noGroup");

                        opGr_0.parent = destOpGrId;
                        self.data.opGroups[destOpGrId].childGroup.push(opGr_0.title);
                        opGr_0.internal.els.rect.removeClass("noGroup");

                        if (typeof (opGr_1) != "undefined") {
                            opGr_1.parent = destOpGrId;
                            self.data.opGroups[destOpGrId].childGroup.push(opGr_1.title);
                            opGr_1.internal.els.rect.removeClass("noGroup");
                        }
                    }
                } else if (confirm("Move operator " + operator_id + " to group " + destOpGrId + "?")) {
                    operatorData.opGroup = destOpGrId;
                    self.data.opGroups[destOpGrId].childNode.push(operator_id);
                    operatorData.internal.els.operator.removeClass("noGroup");
                }

                return { dest: destOpGrId };
            }

            // Small fix has been added in order to manage eventual zoom
            // http://stackoverflow.com/questions/2930092/jquery-draggable-with-zoom-problem
            if (this.options.canUserMoveOperators && operatorData.properties.title != operatorData.opGroup) {
                
                fullElement.operator.draggable({
                    containment: operatorData.internal.properties.uncontained ? false : this.element,
                    handle: '.flowchart-operator-title, .flowchart-operator-body',
                    start: function (e, ui) {
						// ---------------------------------------------------
						// RGT
						// Stop the drag if the canUserMoveOperators is false...
						// RGT replace the line below with the other line...
                        //if (self.lastOutputConnectorClicked != null) {
                        if (self.lastOutputConnectorClicked != null || self.options.readOnly == true) {
						// ---------------------------------------------------
                            e.preventDefault();
                            return;
                        }
                        var elementOffset = self.element.offset();
                        /*
                        console.log("------------------");
                        console.log(e.pageX);
                        console.log(elementOffset.left);
                        console.log(parseInt($(e.target).css('left'), 10));
                        console.log(ui.position.left);
                        console.log(ui.offset.left);
                        */
                        //pointerX: the distance between element left edge and where mouse click under original scale
                        pointerX = (e.pageX - elementOffset.left) / self.positionRatio - parseInt($(e.target).css('left'), 10);
                        pointerY = (e.pageY - elementOffset.top) / self.positionRatio - parseInt($(e.target).css('top'), 10);
                    },
                    drag: function (e, ui) {
                        if (self.options.grid) {
                            var grid = self.options.grid;

                            if (self.positionRatio < 1) {
                                grid = Math.round(grid / self.positionRatio / self.positionRatio);
                            }
                            //console.log("new grid: " + grid);
							// Save the original left and right so we can calculate the change...
							//var uiLeft = ui.position.left;
							//var uiTop = ui.position.top;

							var elementOffset = self.element.offset();
                            //set ui.position.left to (the distance of element left edge to parent left under original scale after grid)
                            ui.position.left = Math.round(((e.pageX - elementOffset.left) / self.positionRatio - pointerX) / grid) * grid;
							ui.position.top = Math.round(((e.pageY - elementOffset.top) / self.positionRatio - pointerY) / grid) * grid;
                            

                            if (!operatorData.internal.properties.uncontained) {
                                ui.position.left = Math.max(ui.position.left, 0);
                                ui.position.top = Math.max(ui.position.top, 0);
								// ---------------------------------------------------
								// Stop it from going too far left or too far right...
                                //ui.position.left = Math.min(Math.max(ui.position.left, 0), self.objs.layers.operators.width() - (fullElement.operator[0].offsetWidth + 20));
								// .. same with the top...
                                //ui.position.top = Math.min(Math.max(ui.position.top, 0), self.objs.layers.operators.height() - (fullElement.operator[0].offsetHeight));
								// ---------------------------------------------------
                            }
                            
                            //element left to parent element left + parent element left to document left
							ui.offset.left = Math.round(ui.position.left + elementOffset.left);
                            ui.offset.top = Math.round(ui.position.top + elementOffset.top);

							// ---------------------------------------------------
							// RGT
							// Calculate the diffs of the operator being moved so they can be applied to the other operators...
							var originalLeft = parseInt(fullElement.operator.css('left'));
							var originalTop = parseInt(fullElement.operator.css('top'));

                            fullElement.operator.css({left: ui.position.left, top: ui.position.top});

							var diffLeft = parseInt(fullElement.operator.css('left')) - originalLeft;
							var diffTop = parseInt(fullElement.operator.css('top')) - originalTop;

							// Try to find the dragged operator in the selectedOperators list...
							// .. if it isn't there then cancel the move of the other operators but keep the list...
							if (self.selectedOperators.find( operator => { return operator._operatorID == $(this).data('operator_id'); } ) != null) {
								// Filter out the operator that is being dragged...
								var filteredOperators = self.selectedOperators.filter( operator => { return operator._operatorID != $(this).data('operator_id'); } );
								filteredOperators.forEach( operator => {
									// Move the other operator...
									// Get the original position...
									var currentPosition = $(operator).position();
									// Update the position with the difference...
									currentPosition.left += diffLeft;
									currentPosition.top += diffTop;

									// Set the position on the screen...
									$(operator).css({ left: currentPosition.left, top: currentPosition.top });

									// Update the operator data to set the new position...
									self.data.operators[operator._operatorID].left = currentPosition.left;
									self.data.operators[operator._operatorID].top = currentPosition.top;

									// Trigger the link redraws...
									operatorChangedPosition(operator._operatorID, currentPosition, false);
								});
							}
							// ---------------------------------------------------
                        }
						// Need to somehow change the positions of all of the operators in the drag select list...
                        operatorChangedPosition($(this).data('operator_id'), ui.position, false);
                   },
                    stop: function (e, ui) {
                        self._unsetTemporaryLink();
                        var operatorId = $(this).data('operator_id');
                        var status = operatorChangedPosition(operatorId, ui.position, true);
                        fullElement.operator.css({
                            height: 'auto'
                        });

                        if (status != null) {
                            var destOpGrId = status.dest;
                            if (destOpGrId == "noGroup") {
                                self.callbackEvent('operatorMoved', [operatorId, self.data.operators[operatorId], null]);
                            } else {
                                self.callbackEvent('operatorMoved', [operatorId, self.data.operators[operatorId], destOpGrId]);
                            }
                        }
                        
                        self.callbackEvent('afterChange', ['operator_moved']);
                    }
                });
            }

            this.callbackEvent('afterChange', ['operator_create']);
        },

        createOpGroup: function (opGroupId, opGroupDataOriginal) {
            var opGroupData = $.extend(true, {}, opGroupDataOriginal);
            if (!this.callbackEvent('opGroupCreate', [opGroupId, opGroupData])) {
                return;
            }

            if (typeof opGroupData.internal == 'undefined') {
                opGroupData.internal = {};
            }
            opGroupData.internal.els = {};

            var self = this;

            var $opGroupRect = $('<div class="flowchart-opGroup"></div>');
            $opGroupRect.appendTo(this.objs.layers.opGroups);
            if (opGroupId.slice(-1) == 0 && !opGroupId.startsWith("ROOT")) {
                //console.log("New opGroup: " + opGroupId);//LOOP1_0
                //place group into parentSubgroup
                var parentOpGroup = this.data.opGroups[opGroupData.parent];
                parentOpGroup.childGroup.push(opGroupId);
                var parentOpGroupWidth = parseInt(parentOpGroup.internal.els.rect.css('width'));
                var parentOpGroupHeight = parseInt(parentOpGroup.internal.els.rect.css('height'));
                opGroupData.geometric.rect_y = parseInt(parentOpGroup.internal.els.rect.css('top')) + parentOpGroupHeight;
                opGroupData.geometric.rect_x = parseInt(parentOpGroup.internal.els.rect.css('left')) + parentOpGroupWidth;

                //extend parent group size until ROOT
                while (!parentOpGroup.title.startsWith("ROOT")) {
                    parentOpGroup.geometric.rect_width = parentOpGroupWidth + opGroupData.geometric.rect_width + 10;
                    parentOpGroup.geometric.rect_height = parentOpGroupHeight + opGroupData.geometric.rect_height + 10;

                    parentOpGroup.internal.els.rect.css({ width: parentOpGroup.geometric.rect_width, height: parentOpGroup.geometric.rect_height });

                    parentOpGroup = this.data.opGroups[parentOpGroup.parent];

                    parentOpGroupWidth = parseInt(parentOpGroup.internal.els.rect.css('width'));
                    parentOpGroupHeight = parseInt(parentOpGroup.internal.els.rect.css('height'));
                } 

                //extend ROOT group
                parentOpGroup.geometric.rect_width = parentOpGroupWidth + opGroupData.geometric.rect_width + 10;
                parentOpGroup.geometric.rect_height = parentOpGroupHeight + opGroupData.geometric.rect_height + 10;

                parentOpGroup.internal.els.rect.css({ width: parentOpGroup.geometric.rect_width, height: parentOpGroup.geometric.rect_height });
                
                //move other elements on the right and the bottom
                for (var opId in self.data.operators) {
                    var isOpMoved = false;
                    var opData = self.data.operators[opId];
                    if (opData.left > opGroupData.geometric.rect_x ) {
                        opData.left = opData.left + opGroupData.geometric.rect_width + 10;
                        opData.internal.els.operator.css({ left: opData.left });
                        isOpMoved = true;
                    }

                    if (opData.top > opGroupData.geometric.rect_y) {
                        opData.top = opData.top + opGroupData.geometric.rect_height + 10;
                        opData.internal.els.operator.css({ top: opData.top });
                        isOpMoved = true;
                    }

                    if (isOpMoved != true) {
                        continue;
                    }

                    //console.log(opId + "is pushed right or(and) down!");
                    self.refreshLinkPositionsByOperatorId(opId);
                }

                for (var opGrId in self.data.opGroups) {
                    var opGrData = self.data.opGroups[opGrId];
                    if (opGrData.geometric.rect_x > opGroupData.geometric.rect_x) {
                        opGrData.geometric.rect_x = opGrData.geometric.rect_x + opGroupData.geometric.rect_width + 10;
                        opGrData.internal.els.rect.css({ left: opGrData.geometric.rect_x });
                    }

                    if (opGrData.geometric.rect_y > opGroupData.geometric.rect_y) {
                        opGrData.geometric.rect_y = opGrData.geometric.rect_y + opGroupData.geometric.rect_height + 10;
                        opGrData.internal.els.rect.css({ top: opGrData.geometric.rect_y });
                    }
                }

            } else if (opGroupId.slice(-1) == 1) {
                var siblingOpGroup = this.data.opGroups[opGroupId.slice(0, -2) + "_0"];
                opGroupData.geometric.rect_y = parseInt(siblingOpGroup.internal.els.rect.css('top'));
                opGroupData.geometric.rect_x = parseInt(siblingOpGroup.internal.els.rect.css('left')) + parseInt(siblingOpGroup.internal.els.rect.css('width')) + 10;

                var parentOpGroup = this.data.opGroups[opGroupData.parent];
                if (!opGroupId.startsWith("ROOT")) {
                    parentOpGroup.childGroup.push(opGroupId);
                }
                var parentOpGroupWidth = parseInt(parentOpGroup.internal.els.rect.css('width'));

                //extend parent group size until ROOT
                while (!parentOpGroup.title.startsWith("ROOT")) {
                    parentOpGroup.geometric.rect_width = parentOpGroupWidth + opGroupData.geometric.rect_width + 10;

                    parentOpGroup.internal.els.rect.css({ width: parentOpGroup.geometric.rect_width});

                    parentOpGroup = this.data.opGroups[parentOpGroup.parent];

                    parentOpGroupWidth = parseInt(parentOpGroup.internal.els.rect.css('width'));
                }

                //extend ROOT group
                if (!opGroupId.startsWith("ROOT")) {
                    parentOpGroup.geometric.rect_width = parentOpGroupWidth + opGroupData.geometric.rect_width + 10;
                    parentOpGroup.internal.els.rect.css({ width: parentOpGroup.geometric.rect_width });
                }

                //move other elements on the right
                for (var opId in self.data.operators) {
                    var opData = self.data.operators[opId];
                    if (opData.left > opGroupData.geometric.rect_x) {
                        opData.left = opData.left + opGroupData.geometric.rect_width + 10;
                        opData.internal.els.operator.css({ left: opData.left });
                        
                        self.refreshLinkPositionsByOperatorId(opId);
                    }
                }

                for (var opGrId in self.data.opGroups) {
                    var opGrData = self.data.opGroups[opGrId];
                    if (opGrData.geometric.rect_x > opGroupData.geometric.rect_x) {
                        //console.log(opGrId + "is on the right");
                        opGrData.geometric.rect_x = opGrData.geometric.rect_x + opGroupData.geometric.rect_width + 10;
                        opGrData.internal.els.rect.css({ left: opGrData.geometric.rect_x });
                    }
                }
            }

            $opGroupRect.css({
                top: opGroupData.geometric.rect_y,
                left: opGroupData.geometric.rect_x,
                width: opGroupData.geometric.rect_width,
                height: opGroupData.geometric.rect_height,
                fill: "none"
            });

            $opGroupRect.data('opGroup_id', opGroupId);
            opGroupData.internal.els.rect = $opGroupRect;
            opGroupData.isPainted = true;

            this.data.opGroups[opGroupId] = opGroupData;

            //Parepare headnode and entry
            var opGroupTop = parseInt(opGroupData.internal.els.rect.css('top'));
            var opGroupLeft = parseInt(opGroupData.internal.els.rect.css('left'));

            if (opGroupId.slice(-1) == 0) {
                opGroupData.headNode.top = opGroupTop - 100;
                opGroupData.headNode.left = opGroupLeft;
                this.createOperator(opGroupData.headNode.properties.title, opGroupData.headNode);
            }

            opGroupData.entry.top = opGroupTop + 10;
            opGroupData.entry.left = opGroupLeft + 10;
            this.createOperator(opGroupData.entry.properties.title, opGroupData.entry);
            opGroupData.internal.els.entry = this.data.operators[opGroupData.entry.properties.title].internal.els.operator;


            function opGroupResize(opGroup_id, newSize) {
                opGroupData.geometric.rect_width = newSize.width;
                opGroupData.geometric.rect_height = newSize.height;

                self.resizeCanvas();
            }

            var isInfiniteFreeSpace = false;
            var freeSpace = -1;
            var opGroupsAncestor = [];
            var opGroupsOutsideFreeSpace = [];
            var operatorsOutsideFreeSpace = [];
            $opGroupRect.resizable({
                handles: 'e, s',
                distance: 30,
                resize: function (event, ui) {
                    if (!isInfiniteFreeSpace && freeSpace == -1) {
                        if (ui.size.width > ui.originalSize.width) {
                            freeSpace = parseFloat($('.flowchart-container').css('width'));
                            //console.log("right");
                            //get all element on the right
                            for (var opId in self.data.operators) {
                                var opData = self.data.operators[opId];
                                var distance = opData.left - (ui.originalPosition.left + ui.originalSize.width);
                                //console.log("[Start] Check op: " + opId + "; opLeft(" + opData.left + ") - rightBorder(" + (ui.originalPosition.left + ui.originalSize.width) + ") = distance(" + distance + ")");
                                //console.log("opData.top(" + opData.top + ") > topBorder(" + ui.originalPosition.top + ")?");
                                //console.log("opData.top(" + opData.top + ") < bottomBorder(" + (ui.originalPosition.top + ui.originalSize.height) + ")?");
                                if ((distance > -1) && (opData.top > ui.originalPosition.top) && (opData.top < (ui.originalPosition.top + ui.originalSize.height))) {
                                    operatorsOutsideFreeSpace.push(opId);
                                    //console.log("Distance to " + opId + ": " + distance);
                                    //console.log("FreeSpace Ori: " + freeSpace);
                                    freeSpace = distance < freeSpace ? distance : freeSpace;
                                    //console.log("FreeSpace to " + opId + ": " + freeSpace);
                                }
                                //console.log("[End] ----------------------------");
                            }

                            for (var opGrId in self.data.opGroups) {
                                var opGrData = self.data.opGroups[opGrId];
                                //calc the dis
                                if (opGrData.geometric.rect_x < ui.originalPosition.left
                                    && opGrData.geometric.rect_y < ui.originalPosition.top
                                    && (opGrData.geometric.rect_x + opGrData.geometric.rect_width) > (ui.originalPosition.left + ui.originalSize.width)
                                    && (opGrData.geometric.rect_y + opGrData.geometric.rect_height) > (ui.originalPosition.top + ui.originalSize.height))
                                {
                                    opGroupsAncestor.push(opGrId);
                                }
                                else if (opGrData.geometric.rect_x > (ui.originalPosition.left + ui.originalSize.width)
                                    && ((opGrData.geometric.rect_y + opGrData.geometric.rect_height > ui.originalPosition.top) || (opGrData.geometric.rect_y < ui.originalPosition.top + ui.originalSize.height)))
                                {
                                    var distance = opGrData.geometric.rect_x - (ui.originalPosition.left + ui.originalSize.width);
                                    opGroupsOutsideFreeSpace.push(opGrId);
                                    //console.log("Distance to " + opGrId + ": " + distance);
                                    //console.log("FreeSpace Ori: " + freeSpace);
                                    freeSpace = distance < freeSpace ? distance : freeSpace;
                                    //console.log("FreeSpace to " + opGrId + ": " + freeSpace);
                                }
                            }
                        } else if (ui.size.height > ui.originalSize.height) {
                            freeSpace = parseFloat($('.flowchart-container').css('height'));
                            //console.log("down");
                            for (var opId in self.data.operators) {
                                var opData = self.data.operators[opId];
                                var distance = opData.top - (ui.originalPosition.top + ui.originalSize.height);
                                if ((distance > -1) && (opData.left > ui.originalPosition.left) && (opData.left < (ui.originalPosition.left + ui.originalSize.width))) {
                                    operatorsOutsideFreeSpace.push(opId);
                                    freeSpace = distance < freeSpace ? distance : freeSpace;
                                }
                            }

                            for (var opGrId in self.data.opGroups) {
                                var opGrData = self.data.opGroups[opGrId];
                                if (opGrData.geometric.rect_x < ui.originalPosition.left
                                    && opGrData.geometric.rect_y < ui.originalPosition.top
                                    && (opGrData.geometric.rect_x + opGrData.geometric.rect_width) > (ui.originalPosition.left + ui.originalSize.width)
                                    && (opGrData.geometric.rect_y + opGrData.geometric.rect_height) > (ui.originalPosition.top + ui.originalSize.height)) {
                                    opGroupsAncestor.push(opGrId);
                                }
                                else if (opGrData.geometric.rect_y > (ui.originalPosition.top + ui.originalSize.height)
                                    && ((opGrData.geometric.rect_x + opGrData.geometric.rect_width > ui.originalPosition.left) || (opGrData.geometric.rect_left < ui.originalPosition.left + ui.originalSize.width))) {
                                    var distance = opGrData.geometric.rect_y - (ui.originalPosition.top + ui.originalSize.height);
                                    opGroupsOutsideFreeSpace.push(opGrId);
                                    freeSpace = distance < freeSpace ? distance : freeSpace;
                                }
                            }

                        }

                        if (operatorsOutsideFreeSpace.length == 0 && opGroupsAncestor.length == 0 && opGroupsOutsideFreeSpace.length == 0) {
                            isInfiniteFreeSpace = true;
                            //console.log("Infinite space!");
                        } else {
                            //console.log("FreeSpace: " + freeSpace);
                            //console.log(operatorsOutsideFreeSpace);
                            //console.log(opGroupsOutsideFreeSpace);
                            //console.log(opGroupsAncestor);
                        }
                    }

                },
                stop: function (event, ui) {
                    //Move operators and opGroups (expand ancester) when the expanded distance larger than the freespace
                    var margin = 20;
                    var distance = 0;
                    var isToTheEast = true;

                    if (ui.size.width > ui.originalSize.width) {
                        isToTheEast = true;
                        distance = ui.size.width - ui.originalSize.width;
                    } else if (ui.size.height > ui.originalSize.height) {
                        isToTheEast = false;
                        distance = ui.size.height - ui.originalSize.height;
                    }

                    //ancester
                    if (opGroupId.startsWith("ROOT")) {
                        //do nothing
                    } else {
                        for (let i = 0; i < opGroupsAncestor.length; i++) {
                            var opGr = self.data.opGroups[opGroupsAncestor[i]];
                            if (isToTheEast) {
                                var opGrWidthOri = parseInt(opGr.internal.els.rect.css('width'));
                                opGr.geometric.rect_width = opGrWidthOri + distance;
                                opGr.internal.els.rect.css({ width: opGrWidthOri + distance });
                            } else {
                                var opGrHeightOri = parseInt(opGr.internal.els.rect.css('height'));
                                opGr.geometric.rect_height = opGrHeightOri + distance;
                                opGr.internal.els.rect.css({ height: opGrHeightOri + distance });
                            }
                            
                        }
                    }

                    var limit = Math.max((freeSpace - margin), 0);

                    if (distance > limit) {
                        var i = 0;
                        var movedOp = [];

                        for (; i < opGroupsOutsideFreeSpace.length; i++) {
                            var opGr = self.data.opGroups[opGroupsOutsideFreeSpace[i]];
                            if (isToTheEast) {
                                opGrLeftOri = parseInt(opGr.internal.els.rect.css('left'));
                                opGr.geometric.rect_x = opGrLeftOri + distance - freeSpace + margin;
                                opGr.internal.els.rect.css({ left: (opGrLeftOri + distance - freeSpace + margin) });
                            } else {
                                opGrTopOri = parseInt(opGr.internal.els.rect.css('top'));
                                opGr.geometric.rect_y = opGrTopOri + distance - freeSpace + margin;
                                opGr.internal.els.rect.css({ top: (opGrTopOri + distance - freeSpace + margin) });
                            }
                            

                            //move operators which are inside of opGroup
                            for (var opId in self.data.operators) {
                                var opData = self.data.operators[opId];
                                //console.log("Check " + opId + "'s " + "parent group(" + opData.opGroup + ") == moved group(" + opGr.title + ")");
                                if (opData.opGroup == opGr.title) {
                                    if (isToTheEast) {
                                        var opLeftOri = parseInt(opData.internal.els.operator.css('left'));
                                        opData.left = opLeftOri + distance - freeSpace + margin;
                                        opData.internal.els.operator.css({ left: (opLeftOri + distance - freeSpace + margin) });
                                    } else {
                                        var opTopOri = parseInt(opData.internal.els.operator.css('top'));
                                        opData.top = opTopOri + distance - freeSpace + margin;
                                        opData.internal.els.operator.css({ top: (opTopOri + distance - freeSpace + margin) });
                                    }
                                    movedOp.push(opId);
                                    
                                    self.refreshLinkPositionsByOperatorId(opId);
                                }
                            }
                        }

                        for (i = 0; i < operatorsOutsideFreeSpace.length; i++) {
                            if (movedOp.includes(operatorsOutsideFreeSpace[i])) {
                                continue;
                            }

                            var opData = self.data.operators[operatorsOutsideFreeSpace[i]];
                            if (isToTheEast) {
                                var opLeftOri = parseInt(opData.internal.els.operator.css('left'));
                                opData.left = opLeftOri + distance - freeSpace + margin;
                                opData.internal.els.operator.css({ left: (opLeftOri + distance - freeSpace + margin) });
                                //console.log("Move " + operatorsOutsideFreeSpace[i] + " to " + opData.internal.els.operator.css('left'));
                            } else {
                                var opTopOri = parseInt(opData.internal.els.operator.css('top'));
                                opData.top = opTopOri + distance - freeSpace + margin;
                                opData.internal.els.operator.css({ top: (opTopOri + distance - freeSpace + margin) });
                                //console.log("Move " + operatorsOutsideFreeSpace[i] + " to " + opData.internal.els.operator.css('top'));
                            }
                            
                            self.refreshLinkPositionsByOperatorId(operatorsOutsideFreeSpace[i]);
                        }
                    }

                    opGroupResize($(this).data('opGroup_id'), ui.size);
                    //reset all variables
                    isInfiniteFreeSpace = false;
                    freeSpace = -1;
                    opGroupsAncestor = [];
                    opGroupsOutsideFreeSpace = [];
                    operatorsOutsideFreeSpace = [];
                }
            });

            function opGroupChangedPosition(opGroup_id, posVal, offsetVal) {

                opGroupData.geometric.rect_y = posVal.top;
                opGroupData.geometric.rect_x = posVal.left;

                //move entry together with group
                var delta_X = posVal.left + 10 - parseInt(opGroupData.internal.els.entry.css('left'));
                var delta_Y = posVal.top + 10 - parseInt(opGroupData.internal.els.entry.css('top'));

                //move all child operators and child groups together with the triggerring element
                var opGrId = opGroup_id;
                var opGrStack = [];

                opGrStack.push(opGroup_id);
                while (opGrStack.length > 0) {
                    opGrId = opGrStack.pop();
                    var opGrData = self.data.opGroups[opGrId];
                    //move the group itself except the triggerring element 
                    if (opGrId != opGroup_id) {
                        opGrData.geometric.rect_x = opGrData.geometric.rect_x + delta_X;
                        opGrData.geometric.rect_y = opGrData.geometric.rect_y + delta_Y;
                        opGrData.internal.els.rect.css({ top: opGrData.geometric.rect_y, left: opGrData.geometric.rect_x });
                    }

                    for (var i = 0; i < opGrData.childNode.length; i++) {
                        var opId = opGrData.childNode[i];
                        var opData = self.data.operators[opId];
                        var oriTop = parseInt(opData.internal.els.operator.css('top'));
                        var oriLeft = parseInt(opData.internal.els.operator.css('left'));
                        opData.internal.els.operator.css({ top: oriTop + delta_Y, left: oriLeft + delta_X });
                        opData.top = parseInt(opData.internal.els.operator.css('top'));
                        opData.left = parseInt(opData.internal.els.operator.css('left'));

                        self.refreshLinkPositionsByOperatorId(opId);
                    }

                    opGrData.entry.top = parseInt(opGrData.internal.els.entry.css('top'));
                    opGrData.entry.left = parseInt(opGrData.internal.els.entry.css('left'));

                    for (var j = 0; j < opGrData.childGroup.length; j++) {
                        opGrStack.push(opGrData.childGroup[j]);
                    }

                }
                /*-------------------------------------old DFS------------------------------------------------*/
                /*
                while (typeof (opGrId) != "undefined") {
                    var hasUnmovedChild = false;
                    var opGrData = self.data.opGroups[opGrId];

                    if (!opGrMoved.includes(opGrId)) {
                        //move the group itself except the triggerring element 
                        if (opGrId != opGroup_id) {
                            opGrData.geometric.rect_x = opGrData.geometric.rect_x + delta_X;
                            opGrData.geometric.rect_y = opGrData.geometric.rect_y + delta_Y;
                            opGrData.internal.els.rect.css({ top: opGrData.geometric.rect_y, left: opGrData.geometric.rect_x });
                        }

                        //move all operators in the group
                        for (var i = 0; i < opGrData.childNode.length; i++) {
                            var opId = opGrData.childNode[i];
                            var opData = self.data.operators[opId];
                            var oriTop = parseInt(opData.internal.els.operator.css('top'));
                            var oriLeft = parseInt(opData.internal.els.operator.css('left'));
                            opData.internal.els.operator.css({ top: oriTop + delta_Y, left: oriLeft + delta_X });
                            opData.top = parseInt(opData.internal.els.operator.css('top'));
                            opData.left = parseInt(opData.internal.els.operator.css('left'));

                            self.refreshLinkPositionsByOperatorId(opId);
                        }

                        opGrData.entry.top = parseInt(opGrData.internal.els.entry.css('top'));
                        opGrData.entry.left = parseInt(opGrData.internal.els.entry.css('left'));

                        opGrMoved.push(opGrId);
                    }
                    
                    for (var j = 0; j < opGrData.childGroup.length; j++) {
                        if (!opGrMoved.includes(opGrData.childGroup[j])) {
                            hasUnmovedChild = true;
                            opGrStack.push(opGrId);
                            opGrId = opGrData.childGroup[j];
                            break;
                        }
                    }

                    if (hasUnmovedChild == false) {
                        opGrId = opGrStack.pop();
                    }
                }
                */


                opGroupData.entry.top = parseInt(opGroupData.internal.els.entry.css('top'));
                opGroupData.entry.left = parseInt(opGroupData.internal.els.entry.css('left'));

                self.resizeCanvas();
            }

            var pointerX;
            var pointerY;
            $opGroupRect.draggable({
                start: function (e, ui) {
                    var elementOffset = self.element.offset();

                    pointerX = (e.pageX - elementOffset.left) / self.positionRatio - parseInt($(e.target).css('left'), 10);
                    pointerY = (e.pageY - elementOffset.top) / self.positionRatio - parseInt($(e.target).css('top'), 10);
                },
                drag: function (e, ui) {
                    if (self.options.grid) {
                        var grid = self.options.grid;

                        // Save the original left and right so we can calculate the change...
                        var uiLeft = ui.position.left;
                        var uiTop = ui.position.top;

                        var elementOffset = self.element.offset();

                        ui.position.left = Math.round(((e.pageX - elementOffset.left) / self.positionRatio - pointerX) / grid) * grid;
                        ui.position.top = Math.round(((e.pageY - elementOffset.top) / self.positionRatio - pointerY) / grid) * grid;

                        // Stop it from going too far left or too far right...
                        ui.position.left = Math.max(ui.position.left, 0);
                        // .. same with the top ..
                        ui.position.top = Math.max(ui.position.top, 0);
                        
                        ui.offset.left = Math.round(ui.position.left + elementOffset.left);
                        ui.offset.top = Math.round(ui.position.top + elementOffset.top);

                    }
                    opGroupChangedPosition($(this).data('opGroup_id'), ui.position, ui.offset);
                },
            });
            $opGroupRect.draggable("disable");

            var $toggleButton = $('<div class="form-row d-flex flex-row-reverse flowchart-opGroup-toggleButton"><label class="switch"><input type="checkbox"><span class="slider round"></span></label></div>');
            $toggleButton.appendTo($opGroupRect);
            $toggleButton.on('change', function (e) {
                if ($(e.target).is(':checked')) {
                    $opGroupRect.addClass("flowchart-opGroup-checked");
                    $opGroupRect.draggable("enable");
                    self.objs.layers.opGroups.on('pointerdown mousedown touchstart', '.flowchart-opGroup', function (e) {
                        e.stopImmediatePropagation();
                    });
                } else {
                    $opGroupRect.removeClass("flowchart-opGroup-checked");
                    $opGroupRect.draggable("disable");
                    self.objs.layers.opGroups.on('pointerdown mousedown touchstart', '.flowchart-opGroup', function (e) { });
                    self.unselectOpGroup();
                }
            });

            var newLinkId = opGroupData.headNode.properties.title + "_" + opGroupData.entry.properties.title;
            var newLink = {
                fromOperator: opGroupData.headNode.properties.title,
                fromConnector: "output_1",
                toOperator: opGroupData.entry.properties.title,
                toConnector: "input_1",
                constraint0: null,
                constraint1: null,
            }
            this.createLink(newLinkId, newLink);

            this.resizeCanvas();

            //console.log("New group:");
            //console.log(this.data.opGroups[opGroupId]);

            this.callbackEvent('afterChange', ['opGroup_create']);
        },

        _drawOpGroup_unused: function (opGroupId) {
            var opGroupData = this.data.opGroups[opGroupId];

            var $opGroupRect = $('<div class="flowchart-opGroup"></div>');
            $opGroupRect.appendTo(this.objs.layers.opGroups);
            $opGroupRect.css({
                top: opGroupData.geometric.rect_y,
                left: opGroupData.geometric.rect_x,
                width: opGroupData.geometric.rect_width,
                height: opGroupData.geometric.rect_height,
                fill: "none"
            });

            var self = this;
            var opGroupEntry = this.data.opGroups[opGroupId].internal.els.entry;
            var pointerX;
            var pointerY;
            
            function opGroupChangedPosition(opGroup_id, pos) {
                opGroupEntry.top = pos.top + 10;
                opGroupEntry.left = pos.left + 10;

            }
            
            $opGroupRect.data('opGroup_id', opGroupId);
            $opGroupRect.resizable({ handles: 'n, e, s, w' });
            $opGroupRect.draggable({
                start: function (e, ui) {
                    var elementOffset = self.element.offset();
                    pointerX = (e.pageX - elementOffset.left) / self.positionRatio - parseInt($(e.target).css('left'), 10);
                    pointerY = (e.pageY - elementOffset.top) / self.positionRatio - parseInt($(e.target).css('top'), 10);
                },
                drag: function (e, ui) {
                    if (self.options.grid) {
                        var grid = self.options.grid;

                        // Save the original left and right so we can calculate the change...
                        var uiLeft = ui.position.left;
                        var uiTop = ui.position.top;

                        var elementOffset = self.element.offset();
                        ui.position.left = Math.round(((e.pageX - elementOffset.left) / self.positionRatio - pointerX) / grid) * grid;
                        ui.position.top = Math.round(((e.pageY - elementOffset.top) / self.positionRatio - pointerY) / grid) * grid;

                        ui.offset.left = Math.round(ui.position.left + elementOffset.left);
                        ui.offset.top = Math.round(ui.position.top + elementOffset.top);
                    }
                    // Need to somehow change the positions of all of the operators in the drag select list...
                    opGroupChangedPosition($(this).data('opGroup_id'), ui.position);
                },
            });
            $opGroupRect.draggable("disable");
            opGroupData.internal.els.rect = $opGroupRect;

            //not able to append this <div>.WHY?
            /*
            var $dragHandleBar = $('<div class="form-row flowchart-opGroup-dragHandleBar"></div>');
            $dragHandleBar.appendTo($opGroupRect);
            */
            var $toggleButton = $('<div class="form-row d-flex flex-row-reverse flowchart-opGroup-toggleButton"><label class="switch"><input type="checkbox"><span class="slider round"></span></label></div>');
            $toggleButton.appendTo($opGroupRect);
            $toggleButton.on('change', function (e) {
                if ($(e.target).is(':checked')) {
                    $opGroupRect.addClass("flowchart-opGroup-checked");
                    $opGroupRect.draggable("enable");
                    self.objs.layers.opGroups.on('pointerdown mousedown touchstart', '.flowchart-opGroup', function (e) {
                        e.stopImmediatePropagation();
                    });
                } else {
                    $opGroupRect.removeClass("flowchart-opGroup-checked");
                    $opGroupRect.draggable("disable");
                    self.objs.layers.opGroups.on('pointerdown mousedown touchstart', '.flowchart-opGroup', function (e) { });
                    self.unselectOpGroup();
                }
            });

        },

        selectOpGroup: function (opGroupId) {
            this.unselectOpGroup();
            if (!this.callbackEvent('opGroupSelect', [opGroupId])) {
                return;
            }
            this.unselectLink();
            this.unselectOperator();
            this.selectedOpGroupId = opGroupId;
        },

        unselectOpGroup: function () {
            //console.log("unselectOpGroup");
            if (this.selectedOpGroupId != null) {
                if (!this.callbackEvent('opGroupUnselect', [])) {
                    return;
                }
                this.selectedOpGroupId = null;
            }
        },

        _opGroupMouseOver: function (opGroupId) {
            if (this.selectedOpGroupId != opGroupId) {

            }
        },

        _opGroupMouseOut: function (opGroupId) {
            if (this.selectedOpGroupId != opGroupId) {

            }
        },

        getOpGroupInfos: function (opGroupId) {
            var opGroupData = this.data.opGroups[opGroupId];
            var infos = {
                title: opGroupData.title,
                parent: opGroupData.parent
            };
            return infos;
        },

        _connectorClicked: function (operator, connector, subConnector, connectorCategory) {
            if (connectorCategory == 'outputs') {
                var d = new Date();
                // var currentTime = d.getTime();
                this.lastOutputConnectorClicked = {
                    operator: operator,
                    connector: connector,
                    subConnector: subConnector
                };
                this.objs.layers.temporaryLink.show();
                var position = this.getConnectorPosition(operator, connector, subConnector);
                var x = position.x + position.width;
                var y = position.y;

				// RGT
				var xScroll = this.canvas.scrollLeft() / this.positionRatio;
				var yScroll = this.canvas.scrollTop() / this.positionRatio;
				var xNew = x + xScroll;
				var yNew = y + yScroll;
				// ---------------------------------------------------

                this.objs.temporaryLink.setAttribute('x1', xNew.toString());
                this.objs.temporaryLink.setAttribute('y1', yNew.toString());
                this._mousemove(x, y);
            }
            if (connectorCategory == 'inputs' && this.lastOutputConnectorClicked != null) {
                var linkId = this.lastOutputConnectorClicked.operator + "_" + operator;
                var linkData = {
                    fromOperator: this.lastOutputConnectorClicked.operator,
                    fromConnector: this.lastOutputConnectorClicked.connector,
                    fromSubConnector: this.lastOutputConnectorClicked.subConnector,
                    toOperator: operator,
                    toConnector: connector,
                    toSubConnector: subConnector,
                    constraint0: "0",
                    constraint1: "0"
                };
                if (!(linkId in this.data.links) && operator != "ROOT" && !(operator.startsWith("Op_") && !this.lastOutputConnectorClicked.operator.startsWith("Op_"))) {
                    this.createLink(linkId, linkData);
                }
                this._unsetTemporaryLink();
            }
        },
        
        _unsetTemporaryLink: function () {
            this.lastOutputConnectorClicked = null;
            this.objs.layers.temporaryLink.hide();
        },

        _mousemove: function (x, y, e) {
            if (this.lastOutputConnectorClicked != null) {

				// RGT
				var xScroll = this.canvas.scrollLeft() / this.positionRatio;
				var yScroll = this.canvas.scrollTop() / this.positionRatio;
				x += xScroll;
				y += yScroll;
				// ---------------------------------------------------

                this.objs.temporaryLink.setAttribute('x2', x);
                this.objs.temporaryLink.setAttribute('y2', y);
            }
        },

        _click: function (x, y, e) {
            var $target = $(e.target);
            if ($target.closest('.flowchart-opGroup').length == 0) {
                this.unselectOpGroup();
            }

            if ($target.closest('.flowchart-operator-connector').length == 0) {
                this._unsetTemporaryLink();
            }

            if ($target.closest('.flowchart-operator').length == 0) {
                this.unselectOperator();
            }

            if ($target.closest('.flowchart-link').length == 0) {
                this.unselectLink();
            }
        },

        _removeSelectedClassOperators: function () {
            this.objs.layers.operators.find('.flowchart-operator').removeClass('selected');
        },

        unselectOperator: function () {
            if (this.selectedOperatorId != null) {
                if (!this.callbackEvent('operatorUnselect', [])) {
                    return;
                }
                this._removeSelectedClassOperators();
                this.selectedOperatorId = null;
            }
        },

        _addSelectedClass: function (operatorId) {
            this.data.operators[operatorId].internal.els.operator.addClass('selected');
        },
        
        callbackEvent: function(name, params) {
            var cbName = 'on' + name.charAt(0).toUpperCase() + name.slice(1);
            var ret = this.options[cbName].apply(this, params);
            if (ret !== false) {
                var returnHash = { 'result': ret };
                this.element.trigger(name, params.concat([returnHash]));
                ret = returnHash['result'];
            }
            return ret;
        },

        selectOperator: function (operatorId) {
            if (!this.callbackEvent('operatorSelect', [operatorId])) {
                return;
            }
            this.unselectLink();
            this.unselectOpGroup();
            this._removeSelectedClassOperators();
            this._addSelectedClass(operatorId);
            this.selectedOperatorId = operatorId;
        },

        addClassOperator: function (operatorId, className) {
            this.data.operators[operatorId].internal.els.operator.addClass(className);
        },

        removeClassOperator: function (operatorId, className) {
            this.data.operators[operatorId].internal.els.operator.removeClass(className);
        },

        removeClassOperators: function (className) {
            this.objs.layers.operators.find('.flowchart-operator').removeClass(className);
        },

        _addHoverClassOperator: function (operatorId) {
            this.data.operators[operatorId].internal.els.operator.addClass('hover');
        },

        _removeHoverClassOperators: function () {
            this.objs.layers.operators.find('.flowchart-operator').removeClass('hover');
        },

        _operatorMouseOver: function (operatorId) {
            if (!this.callbackEvent('operatorMouseOver', [operatorId])) {
                return;
            }
            this._addHoverClassOperator(operatorId);
        },

        _operatorMouseOut: function (operatorId) {
            if (!this.callbackEvent('operatorMouseOut', [operatorId])) {
                return;
            }
            this._removeHoverClassOperators();
        },


        getSelectedOperatorId: function () {
            return this.selectedOperatorId;
        },

        getSelectedLinkId: function () {
            return this.selectedLinkId;
        },

        getSelectedOpGroupId: function () {
            return this.selectedOpGroupId;
        },

        // Found here : http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        _shadeColor: function (color, percent) {
            var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
            return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        },

        colorizeLink: function (linkId, color) {
            var linkData = this.data.links[linkId];
            linkData.internal.els.path.setAttribute('stroke', color);
            linkData.internal.els.rect.setAttribute('fill', color);
            if (this.options.verticalConnection) {
                linkData.internal.els.fromSmallConnector.css('border-top-color', color);
                linkData.internal.els.toSmallConnector.css('border-top-color', color);
            } else {
                linkData.internal.els.fromSmallConnector.css('border-left-color', color);
                linkData.internal.els.toSmallConnector.css('border-left-color', color);
            }
        },

        uncolorizeLink: function (linkId) {
            this.colorizeLink(linkId, this.getLinkMainColor(linkId));
        },

        _connecterMouseOver: function (linkId) {
            if (this.selectedLinkId != linkId) {
                this.colorizeLink(linkId, this._shadeColor(this.getLinkMainColor(linkId), -0.4));
            }
        },

        _connecterMouseOut: function (linkId) {
            if (this.selectedLinkId != linkId) {
                this.uncolorizeLink(linkId);
            }
        },

        unselectLink: function () {
            if (this.selectedLinkId != null) {
                if (!this.callbackEvent('linkUnselect', [])) {
                    return;
                }
                this.uncolorizeLink(this.selectedLinkId, this.options.defaultSelectedLinkColor);
                this.selectedLinkId = null;
            }
        },

        selectLink: function (linkId) {
            this.unselectLink();
            if (!this.callbackEvent('linkSelect', [linkId])) {
                return;
            }
            this.unselectOperator();
            this.unselectOpGroup();
            this.selectedLinkId = linkId;
            this.colorizeLink(linkId, this.options.defaultSelectedLinkColor);
        },

        deleteOpGroup_unused: function (opGroupId) {
            this._deleteOpGroup(opGroupId);
        },

        _deleteOpGroup: function (opGroupId) {
            if (this.selectedOpGroupId == opGroupId) {
                this.unselectOpGroup();
            }
            if (!this.callbackEvent('opGroupDelete', [opGroupId])) {
                return false;
            }

            var opGrData = this.data.opGroups[opGroupId];
            var parentOpGr = this.data.opGroups[opGrData.parent]; 
            //move operators to parent 
            for (var i = 0; i < opGrData.childNode.length; i++) {
                var childOpId = opGrData.childNode[i];
                var childOpData = this.data.operators[childOpId];
                if (childOpData.opGroup != childOpId) {//do not move entry node
                    childOpData.opGroup = parentOpGr.title;
                    parentOpGr.childNode.push(childOpId);
                    //console.log("Move " + childOpId + " to " + childOpData.opGroup);
                }
            }
            //move opGroup to parent
            for (var i = 0; i < opGrData.childGroup.length; i++) {
                var childOpGrId = opGrData.childGroup[i];
                var childOpGrData = this.data.opGroups[childOpGrId];
                childOpGrData.parent = parentOpGr.title;
                parentOpGr.childGroup.push(childOpGrId);
                //console.log("Move " + childOpGrId + " to " + childOpGrData.parent);
            }

            this.removeOpGroupFromParentList(opGroupId);
            opGrData.internal.els.rect.remove();
            delete this.data.opGroups[opGroupId];
            this.callbackEvent('afterChange', ['opGroup_delete']);
        },

        deleteOperator: function (operatorId) {
            if (operatorId == "ROOT" || operatorId == "ROOT_0") {
                alert("ROOT cannot be deleted!");
                return;
            }

            if (operatorId.startsWith("Op_")) {
                if (confirm("Do you want to delete node " + operatorId + "?")) {
                    this._deleteOperator(operatorId);
                }
            } else {
                var opData = this.data.operators[operatorId];
                if (opData.opGroup == operatorId) {
                    this._deleteOpGroup(operatorId);//delete only subgroup_x
                    this._deleteOperator(operatorId);//delete entry node

                    var siblingOpGrId = null;
                    var headNodeId = operatorId.slice(0, -2);
                    if (operatorId.slice(-1) == "0") {
                        siblingOpGrId = headNodeId + "_1";
                    } else {
                        siblingOpGrId = headNodeId + "_0";
                    }
                    if (siblingOpGrId != null && !(siblingOpGrId in this.data.operators)) {
                        //delete headnode if both subgroups are deleted
                        this._deleteOperator(headNodeId);
                    }

                } else {//headNode is selected => delete both subgroups
                    if (typeof this.data.opGroups[operatorId + "_1"] != 'undefined') {
                        this._deleteOpGroup(operatorId + "_1");//delete subgroup_1
                        this._deleteOperator(operatorId + "_1");//delete entry node 
                    }
                    if (typeof this.data.opGroups[operatorId + "_0"] != 'undefined') {
                        this._deleteOpGroup(operatorId + "_0");//delete subgroup_0
                        this._deleteOperator(operatorId + "_0");//delete entry node 
                    }
                    this._deleteOperator(operatorId);//delete headnode
                }
            }
        },

        _deleteOperator: function (operatorId) {
            if (!(operatorId in this.data.operators)) {
                return;
            }
            if (!this.callbackEvent('operatorDelete', [operatorId])) {
                return false;
            }

            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var currentLink = this.data.links[linkId];
                    if (currentLink.fromOperator == operatorId || currentLink.toOperator == operatorId) {
                        this._deleteLink(linkId, true);
                    }
                }
            }

            if (operatorId == this.selectedOperatorId) {
                this.unselectOperator();
            }
            
            this.removeOperatorFromParentList(operatorId);
            this.data.operators[operatorId].internal.els.operator.remove();
            delete this.data.operators[operatorId];

            this.callbackEvent('afterChange', ['operator_delete']);
        },

        _deleteOperator_unused: function (operatorId, replace) {
            if (!this.callbackEvent('operatorDelete', [operatorId, replace])) {
                return false;
            }
            if (!replace) {
                for (var linkId in this.data.links) {
                    if (this.data.links.hasOwnProperty(linkId)) {
                        var currentLink = this.data.links[linkId];
                        if (currentLink.fromOperator == operatorId || currentLink.toOperator == operatorId) {
                            this._deleteLink(linkId, true);
                        }
                    }
                }
            }
            if (!replace && operatorId == this.selectedOperatorId) {
                this.unselectOperator();
            }
            this.data.operators[operatorId].internal.els.operator.remove();
            delete this.data.operators[operatorId];

            this.callbackEvent('afterChange', ['operator_delete']);
        },

        deleteLink: function (linkId) {
            this._deleteLink(linkId, false);
        },

        _deleteLink: function (linkId, forced) {
            if (this.selectedLinkId == linkId) {
                this.unselectLink();
            }
            if (!forced && !linkId.startsWith("Op_")) {
                alert("Cannot delete link " + linkId + "!");
                return;
            }
            if (!this.callbackEvent('linkDelete', [linkId, forced])) {
                if (!forced) {
                    return;
                }
            }
            this.colorizeLink(linkId, 'transparent');
            var linkData = this.data.links[linkId];
            var fromOperator = linkData.fromOperator;
            var fromConnector = linkData.fromConnector;
            var toOperator = linkData.toOperator;
            var toConnector = linkData.toConnector;
            var overallGroup = linkData.internal.els.overallGroup;
            if (overallGroup.remove) {
                overallGroup.remove();
            } else {
                overallGroup.parentNode.removeChild(overallGroup);
            }
            delete this.data.links[linkId];

            this._cleanMultipleConnectors(fromOperator, fromConnector, 'from');
            this._cleanMultipleConnectors(toOperator, toConnector, 'to');

            this.callbackEvent('afterChange', ['link_delete']);
        },

        _cleanMultipleConnectors: function (operator, connector, linkFromTo) {
            if (!this.data.operators[operator].internal.properties[linkFromTo == 'from' ? 'outputs' : 'inputs'][connector].multiple) {
                return;
            }

            var maxI = -1;
            var fromToOperator = linkFromTo + 'Operator';
            var fromToConnector = linkFromTo + 'Connector';
            var fromToSubConnector = linkFromTo + 'SubConnector';
            var els = this.data.operators[operator].internal.els;
            var subConnectors = els.connectors[connector];
            var nbSubConnectors = subConnectors.length;

            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if (linkData[fromToOperator] == operator && linkData[fromToConnector] == connector) {
                        if (maxI < linkData[fromToSubConnector]) {
                            maxI = linkData[fromToSubConnector];
                        }
                    }
                }
            }

            var nbToDelete = Math.min(nbSubConnectors - maxI - 2, nbSubConnectors - 1);
            for (var i = 0; i < nbToDelete; i++) {
                subConnectors[subConnectors.length - 1].remove();
                subConnectors.pop();
                els.connectorArrows[connector].pop();
                els.connectorSmallArrows[connector].pop();
            }
        },

        deleteSelected: function () {
            if (this.selectedLinkId != null) {
                this.deleteLink(this.selectedLinkId);
            }
            if (this.selectedOperatorId != null) {
                this.deleteOperator(this.selectedOperatorId);
            }
        },

        removeOperatorFromParentList: function (operatorId) {
            var opData = this.data.operators[operatorId];
            if (typeof opData == 'undefined') {
                return;
            }

            var parentOpGr = this.data.opGroups[opData.opGroup];
            if (typeof parentOpGr == 'undefined') {
                return;
            }

            for (var i = 0; i < parentOpGr.childNode.length; i++) {
                if (parentOpGr.childNode[i] == operatorId) {
                    parentOpGr.childNode.splice(i, 1);
                }
            }
        },

        removeOpGroupFromParentList: function (opGroupId) {
            var opGrData = this.data.opGroups[opGroupId];
            var parentOpGr = this.data.opGroups[opGrData.parent];
            if (typeof parentOpGr == 'undefined') {
                return;
            }
            for (i = 0; i < parentOpGr.childGroup.length; i++) {
                if (parentOpGr.childGroup[i] == opGroupId) {
                    parentOpGr.childGroup.splice(i, 1);
                }
            }
        },

        setPositionRatio: function (positionRatio) {
            this.positionRatio = positionRatio;
            //console.log(this.positionRatio);
        },

        getPositionRatio: function () {
            return this.positionRatio;
        },

        getData: function () {
            var keys = ['operators', 'links', 'opGroups'];
            var specialOp = ['headNode', 'entry'];
            var data = {};
            data.operators = $.extend(true, {}, this.data.operators);
            data.links = $.extend(true, {}, this.data.links);
            data.opGroups = $.extend(true, {}, this.data.opGroups);
            for (var keyI in keys) {//ketI  = 0
                if (keys.hasOwnProperty(keyI)) {
                    var key = keys[keyI];//key = operators 
                    for (var objId in data[key]) { // opId in this.data.operators
                        if (data[key].hasOwnProperty(objId)) {
                            delete data[key][objId].internal; // this.data.operators[opId].internal
                            for (var keyJ in specialOp) {
                                var val = specialOp[keyJ];
                                if (data[key][objId].hasOwnProperty(val)) {
                                    delete data[key][objId][val].internal;
                                }
                            }
                        }
                    }
                }
            }
            //data.operatorTypes = this.data.operatorTypes;
            return data;
        },

        getDataRef: function () {
            return this.data;
        },

        setOperatorTitle_unused: function (operatorId, title) {
            this.data.operators[operatorId].internal.els.title.html(title);
            if (typeof this.data.operators[operatorId].properties == 'undefined') {
                this.data.operators[operatorId].properties = {};
            }
            this.data.operators[operatorId].properties.title = title;
            this._refreshInternalProperties(this.data.operators[operatorId]);
            this.callbackEvent('afterChange', ['operator_title_change']);
        },

        setOperatorBody: function (operatorId, body) {
            this.data.operators[operatorId].internal.els.body.html(body);
            if (typeof this.data.operators[operatorId].properties == 'undefined') {
                this.data.operators[operatorId].properties = {};
            }
            this.data.operators[operatorId].properties.body = body;
            this._refreshInternalProperties(this.data.operators[operatorId]);
            this.callbackEvent('afterChange', ['operator_body_change']);
        },

        getOperatorInfos: function (operatorId) {
            return [this.data.operators[operatorId].internal.properties.title, this.data.operators[operatorId].opGroup];
        },

        getOperatorBody: function (operatorId) {
            return this.data.operators[operatorId].internal.properties.body;
        },

        setOperatorData_unused: function (operatorId, operatorData) {
            var infos = this.getOperatorCompleteData(operatorData);
            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if ((linkData.fromOperator == operatorId && typeof infos.outputs[linkData.fromConnector] == 'undefined') ||
                        (linkData.toOperator == operatorId && typeof infos.inputs[linkData.toConnector] == 'undefined')) {
                        this._deleteLink(linkId, true);
                    }
                }
            }
            this._deleteOperator(operatorId, true);
            this.createOperator(operatorId, operatorData);
            this._refreshOperatorConnectors(operatorId);
            this.redrawLinksLayer();
            this.callbackEvent('afterChange', ['operator_data_change']);
        },
        
        doesOperatorExists: function (operatorId) {
            return typeof this.data.operators[operatorId] != 'undefined';
        },

        getOperatorData: function (operatorId) {
            var data = $.extend(true, {}, this.data.operators[operatorId]);
            delete data.internal;
            return data;
        },

        getLinksFrom: function(operatorId) {
            var result = [];

            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if (linkData.fromOperator === operatorId) {
                        result.push(linkData);
                    }
                }
            }

            return result;
        },

        getLinksTo: function(operatorId) {
            var result = [];

            for (var linkId in this.data.links) {
                if (this.data.links.hasOwnProperty(linkId)) {
                    var linkData = this.data.links[linkId];
                    if (linkData.toOperator === operatorId) {
                        result.push(linkData);
                    }
                }
            }

            return result;
        },

        getOperatorFullProperties: function (operatorData) {
            if (typeof operatorData.type != 'undefined') {
                var typeProperties = this.data.operatorTypes[operatorData.type];
                var operatorProperties = {};
                if (typeof operatorData.properties != 'undefined') {
                    operatorProperties = operatorData.properties;
                }
                return $.extend({}, typeProperties, operatorProperties);
            } else {
                return operatorData.properties;
            }
        },

        _refreshInternalProperties: function (operatorData) {
            operatorData.internal.properties = this.getOperatorFullProperties(operatorData);
        },

    });
});