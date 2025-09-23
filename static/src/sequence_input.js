// Functions for input sequence
function checkSequence(sequence) {
  // Check if sequence has only ACGU
  for (var c of sequence) {
    if (c != "A" && c != "C" && c != "G" && c != "U") {
      return false;
    }
  }
  return true;
}

function checkStructure(structure) {
  // Check if dot-bracket structure is valid
  for (var c of structure) {
    if (c != "." && c != "(" && c != ")" && c != "<" && c != ">" && c != "{"
      && c != "}" && c != "[" && c != "]" && c != "a" && c != "A" && c != "b"
      && c != "B" && c != "c" && c != "C" && c != "d" && c != "D") {
      return false;
    }
  }
  return true;
}

function getSequenceFromFasta(fasta) {
  var lines = fasta.split("\n");
  if (lines[0][0] != ">") {
    var error = document.getElementById("error-file");
    error.style.display = "block";
    error.innerHTML = `Please check the file format and ensure it is in 
            FASTA format. Try uploading the file again or use a different 
            one.`;
    return "error";
  }
  var sequence = ""; var users_structure = ""; var other_structures = [];
  var other_methods = [];
  var last_line = -1;
  for (var i = 1; i < lines.length; i++) {
    if (lines[i][0] == ">") {
      // End of sequence, start of reference or other structure
      last_line = i;
      break;
    }
    if (lines[i] == "") {
      // Ignore empty lines
      continue;
    }
    sequence += lines[i].replace(/\s/g, "").replace(/\t/g, 
      "").replace(/\n/g, "").toUpperCase().replace(/T/g, "U");
  }
  // If there is a reference structure or other structures, get them
  if (last_line != -1) {
    var inputs_dict = {};
    var input_header = "";
    for (var i = last_line; i < lines.length; i++) {
      if (lines[i] == "") {
        // Ignore empty lines
        continue;
      }
      if (lines[i][0] == ">") {
        // Start of new input
        input_header = lines[i].replace(">", "")
        inputs_dict[input_header] = "";
        continue;
      }
      // Only read input if it is a dot-bracket structure
      if (checkStructure(lines[i])) {
        inputs_dict[input_header] += lines[i].replace(/\s/g, "").replace(/\t/g, 
          "").replace(/\n/g, "");
      }
    }

    // Check if input is a reference structure or other structure
    for (var input_header in inputs_dict) {
      var input = inputs_dict[input_header];
      if (input_header.toLowerCase().includes("reference")) {
        users_structure = input;
      } else {
        other_structures.push(input);
        other_methods.push(input_header);
      }
    }
  }
  if (sequence.length == 0) {
    var error = document.getElementById("error-file");
    error.style.display = "block";
    error.innerHTML = `Please check the file format and ensure it is in 
            FASTA format. Try uploading the file again or use a different 
            one.`;
    sequence = "error";
  } else {
    if (users_structure.length != 0 && sequence.length != users_structure.length) {
      var error = document.getElementById("error-file");
      error.style.display = "block";
      error.innerHTML = `Please check structure provided and ensure it is the 
            same length as the sequence.`;
      sequence = "error";
    }
    if (other_structures.length != 0) {
      for (var i = 0; i < other_structures.length; i++) {
        if (other_structures[i].length != sequence.length) {
          var error = document.getElementById("error-file");
          error.style.display = "block";
          error.innerHTML = `Please check structures provided and ensure they 
            are the same length as the sequence.`;
          sequence = "error";
          break;
        }
      }
    }else {
      other_structures = "";
      other_methods = "";
    }
  }
  var data2submit = {"sequence": sequence, "user_structure": users_structure,
    "other_structures": other_structures, "other_methods": other_methods};
  return data2submit;
}

function cleanSequence(sequence) {
  var seq_array = sequence.split("\n");
  // Ignore fasta header
  if (seq_array[0][0] == ">") {
    seq_array = seq_array.slice(1, seq_array.length);
  }
  sequence = seq_array.join("")

  // Remove spaces, tabs and newlines
  sequence = sequence.replace(/\s/g, "");
  sequence = sequence.replace(/\t/g, "");
  sequence = sequence.replace(/\n/g, "");

  // Replace T with U
  sequence = sequence.toUpperCase().replace(/T/g, "U");
  return sequence;
}

export async function submitSequence(text_area, file_input, rnacentral_id) {
  var data2submit = {"sequence": "", "user_structure": "", 
    "other_structures": "", "other_methods": ""};
  if (rnacentral_id != "") {
    data2submit["sequence"] = "rna";
    return data2submit;
  }
  const text_area_sequence = text_area.value
  var error = document.getElementById("error-sequence");
  error.style.display = "none";
  error = document.getElementById("error-file");
  error.style.display = "none";
  // Check if both input and file are not empty
  if (text_area_sequence != "" && file_input.value != ""){
    error = document.getElementById("error-sequence");
    error.style.display = "block";
    error.innerHTML = "Please insert your sequence by input OR file, not both";
    data2submit["sequence"] = "error";
    return data2submit;
  }
  // Check if both input and file are empty
  if (text_area_sequence == "" && file_input.value == ""){
    error = document.getElementById("error-sequence");
    error.style.display = "block";
    error.innerHTML = "Please insert a sequence";
    data2submit["sequence"] = "error";
    return data2submit;
  }
  if (text_area_sequence != "") {
    // Input from text area
    var sequence = cleanSequence(text_area_sequence);
    error = document.getElementById("error-sequence");
  } else {
    // Input from file
    const file_content = await file_input.files[0].text();
    data2submit = getSequenceFromFasta(file_content);
    var sequence = data2submit["sequence"];
    error = document.getElementById("error-file");
  }

  if (sequence == "error") {
    data2submit["sequence"] = "error";
    return data2submit;
  }
  sequence = sequence.toUpperCase();
  if (checkSequence(sequence)) {
    data2submit["sequence"] = sequence;
    return data2submit;
  } else {
    error.style.display = "block";
    error.innerHTML = `Your sequence is not correct. Please check it and 
                   try again`;
  }
  data2submit["sequence"] = "error";
  return data2submit;
}


