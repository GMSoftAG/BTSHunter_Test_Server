
var bsic_sc_pci_from_rat = function (rat, bsic_pci_sc) {
    var bsic_pci_sc_str = "";
    if (rat === "GSM") {
        bsic_pci_sc_str = "BSIC=" + bsic_pci_sc;
    } else if (rat === "UMTS") {
        bsic_pci_sc_str = "SC=" + bsic_pci_sc;
    } else if (rat === "LTE") {
        bsic_pci_sc_str = "PCI=" + bsic_pci_sc;
    }
    return bsic_pci_sc_str;
};

var location_str_from_array = function (lat, long) {
    return "[ latitude: " + lat + ", longitude: " + long + "]";
};

var is_valid_rat_str = function (rat_str) {
    rat_str = rat_str.toUpperCase();
    return rat_str === "LTE" || rat_str === "UMTS" || rat_str === "GSM";
};

var cell_to_str = function (cell) {
    var result_str = "Cell information: status=" + cell.status + ", reason=" + cell.reason + ", rat=" + cell.rat + ", channel=" + cell.channel + ", providers=[" + cell.providers + "]" + ", " + bsic_sc_pci_from_rat(cell.rat, cell.bsic_sc_pci) + ", CellID=" + cell.cell_id + ", LAC=" + cell.lac;
    if (cell.sib_info) {
        result_str += "\n\t SIB Info:"
        cell.sib_info.forEach(function (sib) {
            result_str += "\n\t\t " + sib.type + ": " + sib.value;
        });
    }
    return result_str;
};

var event_to_str = function (event) {
    return "Event: timestamp=" + event[0] + ", location=" + location_str_from_array(event[1], event[2]) + ", signal=" + event[3] + "db";
};

var msleep = function (n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

var get_current_timestamp = function () {
    return Math.round((new Date()).getTime() / 1000);
}

module.exports.bsic_sc_pci_from_rat = bsic_sc_pci_from_rat;
module.exports.location_str_from_array = location_str_from_array;
module.exports.cell_to_str = cell_to_str;
module.exports.event_to_str = event_to_str;
module.exports.msleep = msleep;
module.exports.get_current_timestamp = get_current_timestamp;
module.exports.is_valid_rat_str = is_valid_rat_str;