import {fetchJSONdata, searchOnRnacentral} from "./fetch.js";

export function formatQuery(input_value, filters, start, size) {
	// Notes: organisms must be searched with TAXONOMY. For example: &TAXONOMY="9606"
	// Experts databases must be searched with expert_db. For example: 
	// &expert_db="rfam"
	// Types must be searched with rna_type. For example: &rna_type="rRNA"
	// For pagination, start must be added. For example: &start=0
	// More than 1,000,000 entries cannot be retrievable at the moment.
	// With size, the number of results per page must be added. For example: &size=10
	var query = input_value;
	if (query == "") {
		query = "rna";
	}

	// TODO:  Apply filters
	for (var filter of Object.keys(filters)) {
		var inputs = document.getElementsByName(filter);
		for (var input of inputs) {
			if (input.checked) {
				if (input.value!="all"){
					query += ` AND ${filters[filter].query}:"${input.value}"`;
				}
			}
		}
	};

	query += `&start=${start}`;//&size=${size}`
	return query;
}

function applyFiltersAndSearch(dialog_search_input, dialog_results_content, filters,
			       start, size) {
	var query = formatQuery(dialog_search_input.value, filters, start, size);
	searchOnRnacentral(dialog_results_content, query).then((json) => {
		showSearchResults(json, dialog_results_content, start, size);
	});
}

function resetFilters(filters) {
	// TODO: Reset filters
	for (var filter of Object.keys(filters)) {
		var inputs = document.getElementsByName(filter);
		for (var input of inputs) {
			if (input.value!="all"){
				input.checked = false;
			} else {
				input.checked = true;
			}
		}
	};
}

export function createRnacentralDialog(dialog, filters, start, size) {
  // This function creates the dialog window for the rnacentral dialog
  const cancel_dialog = document.getElementById("dialog_cancel_button");
  const select_dialog = document.getElementById("dialog_confirm_button");
  const no_selection_error = document
    .getElementById("dialog_nothing_selected_error")

  dialog.children[0].innerHTML = `<div id="dialog_filters_section">
            <div id="dialog_filters_buttons">
                <button id="apply_filters" class="primary medium">Apply filters</button>
                <button id="reset_filters" class="secondary medium">Reset filters</button>
            </div>
            <div id="dialog_filters"></div>
        </div>`;
  var dialog_filters = document.getElementById("dialog_filters");
  // Generate filter from dictionary
  // Each filter was placed in a fieldset. Now I replace the fieldset by a
  // div, but I still name it fieldset (easy to find and format)
  for (var filter of Object.keys(filters)) {
    dialog_filters.innerHTML += `<div id="${filter}_fieldset" 
            class="filter_fieldset"><p class="filter_legend">${filters[filter].legend}</p>
            <div id="${filter}_radios" class="filter_radios"></div>
            </div>`;
    var radios = document.getElementById(filter + "_radios");
    if (filters[filter].inputtype == "radio") {
      radios.innerHTML += `
                <input type="radio" name="${filter}" 
                value="all" checked>All</input><br />`;
    }
    for (var value of filters[filter].values) {
      if (filters[filter].inputtype == "radio") {
        radios.innerHTML += `
                    <input type="radio" name="${filter}" 
                    value="${value.queryvalue}">${value.name}
                    </input><br />`;
      }else if (filters[filter].inputtype == "checkbox") {
        radios.innerHTML += `
                    <input type="checkbox" name="${filter}" 
                    value="${value.queryvalue}">${value.name}
                    </input><br />`;
      }
    }
  }
  dialog.children[0].innerHTML += `<div id="dialog_maincontent">
            <div id=dialog_search> 
                <input type="text" id="dialog_search_input"></input> 
                <button id="dialog_search_button" class="primary medium">Search</button>
            </div>
            <div id="dialog_results">
                <h1 id="dialog_results_title">Results 
                    <small id="dialog_results_count"></small>
                </h1>
                <div id="dialog_results_content"></div>
            </div>
            <div id="pagination">
                <div id="pagination_buttons">
                    <button id="dialog_previous_button" class="secondary small" disabled>
                        Previous</button>
                    <div id="dialog_page_number">${start/size+1}</div>
                    <button id="dialog_next_button" class="secondary small">Next</button>
                </div>
            </div>
        </div>`;

  const dialog_previous_button = document.getElementById("dialog_previous_button");
  const dialog_next_button = document.getElementById("dialog_next_button");
  const dialog_page_number = document.getElementById("dialog_page_number");

  dialog_previous_button.addEventListener("click", function() {
    no_selection_error.hidden = true;
    if (start > 0) {
      start = start - size;
      applyFiltersAndSearch(dialog_search_input, dialog_results_content, 
        filters, start, size);
    }
  });

  dialog_next_button.addEventListener("click", function() {
    no_selection_error.hidden = true;
    start = start + size;
    applyFiltersAndSearch(dialog_search_input, dialog_results_content, 
      filters, start, size);
  });

  dialog_search_button.addEventListener("click", function() {
    no_selection_error.hidden = true;
    start = 0;
    applyFiltersAndSearch(dialog_search_input, dialog_results_content,
      filters, start, size);
  });

  cancel_dialog.addEventListener("click", function() {
    no_selection_error.hidden = true;
    var sequence_id = document.getElementById("rnacentral_sequence_id");
    sequence_id.parentNode.children[0].hidden = true;
    sequence_id.innerHTML = "";
    start = 0;
    //dialog.close();
    var fils = document.querySelectorAll(".filter_radios");
    for (var fil of fils) {
      fil.style.height = "10px";
    }
    document.getElementById("dialog_results_content").style.maxHeight = "100px";
    dialog.style.display = "none";
    document.getElementById("clear_rnacentral").hidden = true;
    document.getElementById("cite_link").style.display = "flex";
    document.getElementById("cite_message").style.display = "block";
    document.getElementById("submit_button").disabled = false;
  });

  select_dialog.addEventListener("click", function() {
    no_selection_error.hidden = true;
    var sequence_id = document.getElementById("rnacentral_sequence_id");
    var results = document.getElementById("dialog_results_content").children;
    sequence_id.innerHTML = "";
    for (var result of results) {
      if (result.className == "dialog_result_selected") {
        sequence_id.parentNode.children[0].hidden = false;
        sequence_id.innerHTML = result.children[1].textContent
          .trim();
        break;
      }
    }
    if (sequence_id.innerHTML == "") {
      no_selection_error.hidden = false;
      return;
    }
    start = 0;
    //dialog.close();
    var fils = document.querySelectorAll(".filter_radios");
    for (var fil of fils) {
      fil.style.height = "10px";
    }
    document.getElementById("dialog_results_content").style.maxHeight = "100px";
    dialog.style.display = "none";
    document.getElementById("clear_rnacentral").hidden = false;
    document.getElementById("cite_link").style.display = "flex";
    document.getElementById("cite_message").style.display = "block";
    document.getElementById("submit_button").disabled = false;
  });

	const apply_filters = document.getElementById("apply_filters");
	apply_filters.addEventListener("click", function() {
		no_selection_error.hidden = true;
		start = 0;
		applyFiltersAndSearch(dialog_search_input, dialog_results_content, 
			filters, start, size);
	});

	const reset_filters = document.getElementById("reset_filters");
	reset_filters.addEventListener("click", function() {
		no_selection_error.hidden = true;
		start = 0;
		resetFilters(filters);
		applyFiltersAndSearch(dialog_search_input, dialog_results_content, 
			filters, start, size);
	});
}

export function showSearchResults(json, results, start, size) {
  var dialog_result_height = document.getElementById("dialog_results").clientHeight;
  var dialog_result_title_height = document.getElementById("dialog_results_title").offsetHeight;
  var dialog_result_content_height = dialog_result_height - dialog_result_title_height - 50;
  console.log(dialog_result_height, dialog_result_title_height, dialog_result_content_height);
  results.style.maxHeight = dialog_result_content_height + "px";
  var prev_button = results.parentElement.parentElement
    .querySelector("#dialog_previous_button");
  var next_button = results.parentElement.parentElement
    .querySelector("#dialog_next_button");
  var page_number = results.parentElement.parentElement
    .querySelector("#dialog_page_number");
  if (json.entries.length == 0) {
    results.innerHTML = "No results found";
    prev_button.disabled = true;
    next_button.disabled = true;
    page_number.innerHTML = "1";
    return;
  }
  results.parentElement.querySelector("#dialog_results_count")
    .innerHTML = ` (showing results ${start+1}-${start+json.entries.length} 
                of ${json.hitCount})`;
  results.innerHTML = "";
  if (start == 0) {
    prev_button.disabled = true;
  }else {
    prev_button.disabled = false;
  }
  if (start + size >= json.hitCount) {
    next_button.disabled = true;
  }else {
    next_button.disabled = false;
  }
  page_number.innerHTML = `${start/size+1}`
  for (var res of json.entries) {
    results.innerHTML += `<div class="dialog_result_not_selected">
                <p class="result_description">
                ${res.fields.description}</p><p class="result_id">
                ${res.id}</p><p class="result_length">
                <b>${res.fields.length}</b> nucleotides</p>
            </div>`;
  }
}
