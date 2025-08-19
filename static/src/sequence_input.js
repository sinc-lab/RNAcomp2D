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
	var sequence = "";
	for (var i = 1; i < lines.length; i++) {
		if (lines[i][0] == ">") {
			// Ignore more sequences
			break;
		}
        if (lines[i] == "") {
            // Ignore empty lines
            continue;
        }
		sequence += lines[i].replace(/\s/g, "").replace(/\t/g, 
          "").replace(/\n/g, "").toUpperCase().replace(/T/g, "U");
	}
	return sequence;
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
	if (rnacentral_id != "") {
		return "rna";
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
		return "error";
	}
	// Check if both input and file are empty
	if (text_area_sequence == "" && file_input.value == ""){
		error = document.getElementById("error-sequence");
		error.style.display = "block";
		error.innerHTML = "Please insert a sequence";
		return "error";
	}
	if (text_area_sequence != "") {
		// Input from text area
		var sequence = cleanSequence(text_area_sequence);
		error = document.getElementById("error-sequence");
	} else {
		// Input from file
		const file_content = await file_input.files[0].text();
		var sequence = getSequenceFromFasta(file_content);
		error = document.getElementById("error-file");
	}

	if (sequence == "error") {
		return "error";
	}
	sequence = sequence.toUpperCase();
	if (checkSequence(sequence)) {
		return sequence
	} else {
		error.style.display = "block";
		error.innerHTML = `Your sequence is not correct. Please check it and 
				   try again`;
	}
	return "error";
}


