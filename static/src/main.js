import {fetchJSONdata, searchOnRnacentral, fetchRnacentral} from "./fetch.js";
import {submitSequence} from "./sequence_input.js";
import {createMethodSelectors, selectMethod, editMethod, selectToSubmit} from 
"./methods_selector.js";
import {createRnacentralDialog, showSearchResults, formatQuery} from "./rnacentraldialog.js";

// Submit form
async function submitForm(text_area, file_input, methods_parameters, rnacentral_id) {
	var error = document.getElementById("error-sequence");
	error.style.display = "none";
	error = document.getElementById("error-file");
	error.style.display = "none";

	var sequence = await submitSequence(text_area, file_input, rnacentral_id);

	if (text_area.value != "" && rnacentral_id != ""){
		error = document.getElementById("error-sequence");
		error.style.display = "block";
		error.innerHTML = "Please insert your sequence by only one input";
		return;
	}
	if (file_input.value != "" && rnacentral_id != ""){
		error = document.getElementById("error-sequence");
		error.style.display = "block";
		error.innerHTML = "Please insert your sequence by only one input";
		return;
	}
	var secondary_structure = "";

	if (sequence == "error") {
		return;
	}

	document.getElementById("submit_message").innerHTML = `<div class="loader"></div>
							Sending data to server...`;
	document.getElementById("submit_message").style.display = "flex";
	document.getElementById("submit_button").disabled = true;

	if (rnacentral_id != "") {
		console.log(rnacentral_id);
		var json = await fetchRnacentral(rnacentral_id);
		console.log(json);
		sequence = json["sequence"];
		secondary_structure = json["secondary_structure"];
	}

	if (sequence == "") {
		error = document.getElementById("error-sequence");
		error.style.display = "block";
		error.innerHTML = "Error: No sequence found";
		return;
	}

	var selected_methods = selectToSubmit(methods_parameters);
	if (Object.keys(selected_methods).length == 0) {
		error = document.getElementById("error-methods");
		error.style.display = "block";
		error.innerHTML = "Please select at least one method";
		document.getElementById("submit_message").innerHTML = '';
		document.getElementById("submit_message").style.display = "none";
		document.getElementById("submit_button").disabled = false;
		return;
	}else {
		error = document.getElementById("error-methods");
		error.style.display = "none";
	}
	var data = { 
		"sequence": sequence,
		"methods": selected_methods,
		"rnacentral_id": rnacentral_id,
		"secondary_structure": secondary_structure
	}
	console.log(data);

	// Send data to backend
	fetch("/show_results", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	}).then(response => {
		if (response.redirected) {
			window.location = response.url;
		}else {
			response.text().then(text => {
				document.getElementById("html").innerHTML = text
			})
		}
	})
}

////////////////////////////////////////////////////////////////////////
// Methods parameters                                                 //
////////////////////////////////////////////////////////////////////////
//const methods = ["RNAfold", "RNAstructure", "LinearFold", 
//                 "LinearPartition", "sincFold", "UFold", "REDfold"];
const methods = ["RNAfold", "RNAstructure", "LinearFold", "LinearPartition",
                 "sincFold", "UFold", "REDfold"];
var methods_parameters = {};

for (var meth of methods) {
	// Read parameters from file
	//var path = "../static/methods/" + meth + "/params.json";
	var path = "../static/methods/" + meth + ".json";
	// open file
	await fetchJSONdata(path, meth, methods_parameters);
}

////////////////////////////////////////////////////////////////////////
//  RNAcentral dialog                                                 //
////////////////////////////////////////////////////////////////////////
const rnacentral_dialog = document.getElementById("rnacentral_dialog");
const rnacentral_button = document.getElementById("rnacentral_button");
const available_filters = ["Types", "Databases", "Organisms"];
var start = 0; var size = 15;
const sequence_id = document.getElementById("rnacentral_sequence_id");
const dialog_no_selected_error = document.getElementById("dialog_nothing_selected_error");

var filters = {};
// Read filter options from file
for (var filter of available_filters) {
	var path = "../static/filters/" + filter + ".json";
	await fetchJSONdata(path, filter, filters);
};
createRnacentralDialog(rnacentral_dialog, filters, start, size, sequence_id);
const search_results = document.getElementById("dialog_results_content");

////////////////////////////////////////////////////////////////////////
// DOM events                                                         //
////////////////////////////////////////////////////////////////////////
const text_area  = document.getElementById("seq_string");
const file_input = document.getElementById("seq_file");
const form = document.getElementById("myForm");
var editor = document.getElementById("method_editor");

// TODO: Create list of methods programmatically //
var met_div = document.getElementById("available_methods");
createMethodSelectors(met_div, methods, methods_parameters);

// Events for selecting methods
var methods_divs = document.getElementsByClassName("method_selected");
for (var div of methods_divs) {
	div.addEventListener("click", (e) => selectMethod(e, editor));
}

// Events for editing methods
var edit_img = document.getElementsByClassName("edit_img");
for (var img of edit_img) {
	img.addEventListener("click", (e) => editMethod(e, methods_parameters));
}

// Open RNAcentral dialog
rnacentral_button.addEventListener("click", function() {
	document.getElementById("error-sequence").style.display = "none";
	document.getElementById("error-file").style.display = "none";
	start = 0;
	size = 15;
	// TODO: Reset filters
	var query = formatQuery(document.getElementById("dialog_search_input").value, 
				filters, start, size);
	rnacentral_dialog.showModal();
	searchOnRnacentral(search_results, query).then((json) => {
		showSearchResults(json, search_results, start, size);
	})
});

// Events for select sequence from RNAcentral
search_results.addEventListener("click", function(e) {
	dialog_no_selected_error.hidden = true;
	var selection = e.target;
	console.log(selection.tagName);
	if (selection.tagName == "P") {
		selection = selection.parentNode;
	};
	if (selection.className == "dialog_result_selected") {
		selection.className = "dialog_result_not_selected";
	} else if (selection.className == "dialog_result_not_selected") {
		for (var resultdiv of selection.parentNode.childNodes) {
			if (resultdiv.className == "dialog_result_selected") {
				resultdiv.className = "dialog_result_not_selected";
			}	
		};
		selection.className = "dialog_result_selected";	
	};
});

// Submit form
const submit_btn = document.getElementById("submit_button");
submit_btn.addEventListener("click", () => submitForm(text_area, file_input, 
	methods_parameters, sequence_id.textContent));

// Don't refresh page when submit form
function handleForm(e){
	e.preventDefault();
} 

form.addEventListener('submit', handleForm);

