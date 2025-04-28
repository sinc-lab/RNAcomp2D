//import {showSearchResults} from "./rnacentraldialog.js";
// Fetch data from backend
export async function fetchJSONdata(path, label, dictionary) {
	await fetch(path)
		.then((res) => {if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);} 
		return res.json();
		})
		.then((json) => {
			dictionary[label] = json;
		})
		.catch((error) => {
			console.log(error);
		});
}

// Search on Rnacentral
export async function searchOnRnacentral(results, query) {
	//var url = "https://rnacentral.org/api/v1/rna" + query;
	//var url = "https://www.ebi.ac.uk/ebisearch/ws/rest/rnacentral"
	var url = "https://www.ebi.ac.uk/ebisearch/ws/rest/rnacentral?"
	url += "query=" + query + "&fields=description,length&format=json"
	// TODO: Add waiting message
	results.innerHTML = `<div class="loader_container" 
				style="justify-content: flex-start">
				<div class="loader"></div>
				<div class="loader_text">Searching...</div></div>`;
	results.parentElement.querySelector("#dialog_results_count")
		.innerHTML = "";
	results.parentElement.parentElement
		.querySelector("#dialog_previous_button").disabled = true;
	results.parentElement.parentElement
		.querySelector("#dialog_next_button").disabled = true;
	var json = await fetch(url)
		.then((res) => {if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);} 
		return res.json();
		})
		.then((json) => {
			//showSearchResults(json, results);
			results.parentElement.parentElement
				.querySelector("#dialog_previous_button").disabled = false;
			results.parentElement.parentElement
				.querySelector("#dialog_next_button").disabled = false;
			return json
		})
		.catch((error) => {
			console.log(error);
		});
	return json
}

export async function fetchRnacentral(rnacentral_id) {
	var json_results = {};
	var url = "https://rnacentral.org/api/v1/rna/" + rnacentral_id.split("_")[0];
	var json = await fetch(url)
		.then((res) => {if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);} 
		return res.json();
		})
		.then((json) => {
			return json
		})
		.catch((error) => {
			console.log(error);
		});
	var url2 = "https://rnacentral.org/api/v1/rna/"+rnacentral_id.split("_")[0]+"/2d/";
	var json2 = await fetch(url2)
		.then((res) => {if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);} 
		return res.json();
		})
		.then((json) => {
			console.log(json);
			return json
		})
		.catch((error) => {
			console.log(error);
		});

	json_results["sequence"] = json.sequence;
	if (json2.data.secondary_structure) {
		json_results["secondary_structure"] = json2.data.secondary_structure;
	} else {
		json_results["secondary_structure"] = "";
	}
	return json_results
}
