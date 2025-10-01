// All possible matching brackets for base pairing
const MATCHING_BRACKETS = [["(", ")"], ["[", "]"], ["{", "}"], ["<", ">"], ["A", "a"], ["B", "b"]];

// Get base-pairs from dot
export function get_bp(dotBracket) {
  const openToClose = {};
  const closeToOpen = {};

  for (const [open, close] of MATCHING_BRACKETS) {
    openToClose[open] = close;
    closeToOpen[close] = open;
  }
  const stacks = {};
  for (const [open] of MATCHING_BRACKETS) {
    stacks[open] = [];
  }

  const pairs = [];

  for (let i = 0; i < dotBracket.length; i++) {
    const char = dotBracket[i];

    if (openToClose.hasOwnProperty(char)) {
      stacks[char].push(i);
    }
    else if (closeToOpen.hasOwnProperty(char)) {
      const openChar = closeToOpen[char];
      const stack = stacks[openChar];
      if (!stack || stack.length === 0) {
        throw new Error(`Unmatched closing symbol '${char}' at position ${i}`);
      }
      const openIndex = stack.pop();
      pairs.push([openIndex, i]);
    }
  }
  for (const openChar in stacks) {
    if (stacks[openChar].length > 0) {
      throw new Error(`Unmatched opening symbol '${openChar}' at positions ${stacks[openChar].join(", ")}`);
    }
  }

  pairs.sort((a, b) => a[0] - b[0]);

  return pairs;

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
    //console.log(tp, fp, fn, precision, recall, f1);
    if (tp == 0){
        return 0;
    }
    var f1 = (2 * precision * recall) / (precision + recall); 
    return f1;
}
