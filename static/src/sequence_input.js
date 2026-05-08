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
  // If first line is not a fasta header, return error
  if (lines[0][0] != ">") {
    var error = document.getElementById("error-file");
    error.style.display = "block";
    error.innerHTML = `Please check the file format and ensure it is in 
            FASTA format. Try uploading the file again or use a different 
            one.`;
    return "error";
  }
  var names_read = []; var sequences_read = []; var structures_read = [];
  var reading_sequence = false; var reading_structure = false;
  // Read sequence and structure from fasta file. We know that first line is a
  // fasta header, so start reading a name
  for (var line of lines) {
    if (line[0] == ">" && reading_sequence == false) {
      var name = line.slice(1, line.length).trim();
      names_read.push(name);
      // Add empty sequence and start reading sequence
      sequences_read.push(""); reading_sequence = true; reading_structure = false;
    } else if (line[0] == ">" && reading_sequence == true) {
      // ERROR: More than one sequence in file
      var error = document.getElementById("error-file");
      error.style.display = "block";
      error.innerHTML = `There is an error in the file. Please check the format and upload the file again. See examples provided for more information.`;
      return "error";
    } else if (reading_sequence == true) {
      var seq_part = line.trim();
      seq_part = seq_part.toUpperCase().replace(/T/g, "U").replace(/\s/g, "")
        .replace(/\t/g, "").replace(/\n/g, "");
      // Check if sequence is valid
      if (checkSequence(seq_part) == false) {
        // If sequence is not valid, but is a structure, start reading structure
        if (checkStructure(seq_part) == true) {
          reading_structure = true; reading_sequence = false;
          structures_read.push(seq_part);
          continue;
        } else {
          // ERROR: There is an error in a sequence
          var error = document.getElementById("error-file");
          error.style.display = "block";
          error.innerHTML = `There is an error in a sequence. Please check the 
          file and try uploading the file again.`;
          return "error";
        }
      } else {
        // Add sequence part to last sequence
        sequences_read[sequences_read.length-1] += seq_part;
      }
    } else if (reading_structure == true) {
      var struct_part = line.trim();
      struct_part = struct_part.replace(/\s/g, "").replace(/\t/g, "")
        .replace(/\n/g, "");
      // Check if structure is valid
      if (checkStructure(struct_part) == false) {
        // ERROR: There is an error in a structure
        var error = document.getElementById("error-file");
        error.style.display = "block";
        error.innerHTML = `There is an error in a structure. Please check the 
        file and try uploading the file again.`;
        return "error";
      } else {
        // Add structure part to last structure
        structures_read[structures_read.length-1] += struct_part;
      }
    }
  }
  // If there is no structure, only accept one name and one sequence
  if (structures_read.length == 0) {
    if (names_read.length > 1 || sequences_read.length > 1) {
      var error = document.getElementById("error-file");
      error.style.display = "block";
      error.innerHTML = `There is more than one sequence in the file.`;
      return "error";
    } else {
      // Return the sequence only
      var data2submit = {"sequence": sequences_read[0], "user_structure": "",
        "other_structures": [], "other_methods": []};
      return data2submit;
    }
  }
  // Check if all list of names, sequences and structures are the same length
  if (names_read.length != sequences_read.length ||
      names_read.length != structures_read.length) {
    var error = document.getElementById("error-file");
    error.style.display = "block";
    error.innerHTML = `There is an error in the file. Please check the format and upload the file again. See examples provided for more information.`;
    return "error";
  }
  // If everything is ok, check if there is a reference structure
  var sequence = sequences_read[0];
  //var sequence = "error";
  var users_structure=""; var other_methods=[]; var other_structures=[];
  for (var i = 0; i < sequences_read.length; i++) {
    if (names_read[i].toLowerCase().includes("reference")) {
      users_structure = structures_read[i];
    } else {
      other_methods.push(names_read[i]);
      other_structures.push(structures_read[i]);
    }
  }
  var data2submit = {"sequence": sequence, "user_structure": users_structure,
    "other_structures": other_structures, "other_methods": other_methods};
  console.log(data2submit);
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


