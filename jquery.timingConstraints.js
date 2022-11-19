jQuery(function ($) {
    // the widget definition, where "pcim" is the namespace,
    // "constraints" the widget name
    $.widget("pcim.timingConstraints", {
        // default options
        options: {},

        // the constructor
        _create: function () {
        },
        
        isNumber: function (obj) {
            return typeof obj === 'number' && !isNaN(obj)
        },

        getConstraints: function (instructionName, args) {
            switch (instructionName) {
                case "HALT":
                case "JUMP":
                case "LOOP":
                case "BW":
                case "BRANCH":
                    break;
                case "WAIT":
                    if (this.isNumber(args.cycle)) {
                        return {
                            "0-1": {
                                "c1": args.cycle + 1,
                                "c2": args.cycle + 1
                            }
                        };
                    } else {
                        alert("Wrong args for WAIT");
                    }
                    break;
                case "RACCU":
                    return {
                        "0-1": {
                            "c1": 1,
                            "c2": "+INF"
                        }
                    };
                case "SWB":
                    return {
                        "0-1": {
                            "c1": 0,
                            "c2": "+INF"
                        },
                        "1-2": {
                            "c1": 1,
                            "c2": "+INF"
                        }
                    };
                case "ROUTE":
                    return {
                        "0-1": {
                            "c1": 1,
                            "c2": "+INF"
                        },
                        "1-2": {
                            "c1": 1,
                            "c2": "+INF"
                        },
                        "2-3": {
                            "c1": 1,
                            "c2": "+INF"
                        }
                    };
                case "REFI":
                    if (this.isNumber(args.l1_iter)) {
                        return {
                            "0-1": {
                                "c1": 0,
                                "c2": "+INF"
                            },
                            "1-2": {
                                "c1": 0,
                                "c2": 63
                            },
                            "2-3": {
                                "c1": args.l1_iter + 1,
                                "c2": args.l1_iter + 1
                            }
                        };
                    } else {
                        alert("Wrong args for REFI");
                    }
                    break;
                case "DPU":
                    return {
                        "0-1": {
                            "c1": 0,
                            "c2": "+INF"
                        },
                        "1-2": {
                            "c1": 1,
                            "c2": 1
                        },
                        "2-3": {
                            "c1": 1,
                            "c2": "+INF"
                        }
                    };
                case "SRAM":
                    if (this.isNumber(args.hops) && this.isNumber(args.l1_iter)) {
                        return {
                            "0-1": {
                                "c1": 1,
                                "c2": "+INF"
                            },
                            "1-2": {
                                "c1": args.hops + 1,
                                "c2": args.hops + 1
                            },
                            "2-3": {
                                "c1": 0,
                                "c2": 63
                            },
                            "3-4": {
                                "c1": args.l1_iter + 1,
                                "c2": args.l1_iter + 1
                            }
                        };
                    } else {
                        alert("Wrong args for SRAM");
                    }
                    break;
            }
            return {};
        },
    });
})
