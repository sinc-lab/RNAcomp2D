// Get base-pairs from dot
export function get_bp(dot) {
    var bp = [];
    var open_bracket = [];
    var close_bracket = [];
    for (var i = 0; i < dot.length; i++) {
        if (dot[i] == "(") {
            open_bracket.push(i);
        }
        if (dot[i] == ")") {
            close_bracket.push(i);
        }
    }
    if (open_bracket.length != close_bracket.length) {
        return -1;
    }
    close_bracket = close_bracket.reverse();
    for (var i = 0; i < open_bracket.length; i++) {
        bp.push([open_bracket[i], close_bracket[i]]);
    }
    return bp;
}


// Get F1 score
export function get_f1(ref_bp, pred_bp) {
    if (!Array.isArray(ref_bp) || !Array.isArray(pred_bp)) {
        return -1;
    }
    console.log(ref_bp, pred_bp);
    var tp = 0;
    var fp = 0;
    var fn = 0;
    for (var i = 0; i < pred_bp.length; i++) {
        var found = false;
        for (var j = 0; j < ref_bp.length; j++) {
            if (pred_bp[i][0] == ref_bp[j][0] && pred_bp[i][1] == ref_bp[j][1]) {
                found = true;
                break;
            }
        }
        if (found) {
            tp += 1;
        } else {
            fp += 1;
        }
    }
    for (var i = 0; i < ref_bp.length; i++) {
        var found = false;
        for (var j = 0; j < pred_bp.length; j++) {
            if (ref_bp[i][0] == pred_bp[j][0] && ref_bp[i][1] == pred_bp[j][1]) {
                found = true;
                break;
            }
        }
        if (!found) {
            fn += 1;
        }
    }
    var precision = tp / (tp + fp);
    var recall = tp / (tp + fn);
    console.log(tp, fp, fn, precision, recall, f1);
    if (tp == 0){
        return 0;
    }
    var f1 = (2 * precision * recall) / (precision + recall); 
    return f1;
}
