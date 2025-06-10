// Functions to manage the user interface

////////////////////////////////////////////////////////////////////////
//                           Method editor                            //
////////////////////////////////////////////////////////////////////////
function createEditorForm(form, options) {
	// Add method parameters to editor form. This function is called when
	// user clicks on edit button (see editMethod function)
	form.innerHTML = "";
	for (var param of options["parameters"]) {
		if (param["type"] == "number") {
			form.innerHTML += `<label>${param["description"]}: </label>
						<input type="${param["type"]}" 
						value=${param["value"]} 
						style="width: 70px;"> <br />`;
		} else if (param["type"] == "checkbox") {
			if (param["value"] == true) {
				var chk = "checked";
			}else {
				var chk = "unchecked";
			}
			form.innerHTML += `<label>${param["description"]}: </label>
						<input type="${param["type"]}" ${chk}> 
						<br />`;
		}
	}

}

function openMethodEditor(editor, editing_method, methods_parameters) {
	// This function is called when user clicks on edit button (see editMethod
	// function)
	editor.style.display = "block";
	editor.className = editing_method;
	editor.innerHTML = `<div id="parameters_editor_div">
			<div id="method_editor_content">
			<label id="editor_label">
			${editing_method} - Edit parameters</label><br>
			<div id="method_editor_form"></div></div><br>
			<div id="method_editor_buttons">
			<button id="cancel_edit_button">Cancel</button>
			<button id="save_edit_button">Save</button></div>
			</div>`;
	createEditorForm(document.getElementById("method_editor_form"), 
					 methods_parameters[editing_method]);
}

function closeMethodEditor(editor) {
	// This function is called when user cancels editing. It closes the editor 
	// window
	editor.style.display = "none";
	editor.className = "hidden";
	editor.innerHTML = '';
}

function saveMethodButton(editing_method, row_target, editor, 
	                      methods_parameters) {
	// This function is called when user clicks on save button. It saves the 
	// edited parameters, returns to selected state and closes the editor.
	var count = 2;
	var form = document.getElementById("method_editor_form");
	for (var param of methods_parameters[editing_method]["parameters"]) {
		if (param["type"] == "number") {
			param["value"] = Number(form.childNodes[count].value);
		}
		if (param["type"] == "checkbox") {
			param["value"] = form.childNodes[count].checked;
		}
		count += 5;
	}
	markMethodAsNotEditing(row_target);
	closeMethodEditor(editor);
}

function cancelEditingButton(row_target, editor) {
	// This function is called when user clicks on cancel button. It returns to
	// selected state and closes the editor
	markMethodAsNotEditing(row_target);
	closeMethodEditor(editor);
}

////////////////////////////////////////////////////////////////////////
//                          Method selector                           //
////////////////////////////////////////////////////////////////////////
function markMethodAsSelected(target) {
	// This method will be computed. This function will be called when user 
	// clicks on method selector (see selectMethod function)
	target["className"] = "method_selected";
	target.childNodes[1].src = `${APP_ROOT}/static/imgs/box-checked.svg`;
	target.childNodes[3].className = "selected_label";
  if (target.parentNode.childNodes.length > 3) {
  	target.parentNode.childNodes[3].style.display = "block";
  }
}

function markMethodAsUnselected(target) {
	// This method will not be computed. This function will be called when 
	// user clicks on method selector (see selectMethod function)
	target["className"] = "method_unselected";
	target.childNodes[1].src = `${APP_ROOT}/static/imgs/box-empty.svg`;
	target.childNodes[3].className = "unselected_label";
  if (target.parentNode.childNodes.length > 3) {
  	target.parentNode.childNodes[3].style.display = "none";
  }
}

function markMethodAsEditing(target) {
	// This method is being edited by the user. This function will be called 
	// when user clicks on edit button (see editMethod function)
	target.childNodes[1]["className"] = "editing_method";
	target.childNodes[1].childNodes[1].src = `${APP_ROOT}/static/imgs/box-editing.svg`;
	target.childNodes[1].childNodes[3].className = "editing_label";
	target.childNodes[3].src = `${APP_ROOT}/static/imgs/editing.svg`;
}

function markMethodAsNotEditing(target) {
	// User finished (or canceled) editing. Method returns to selected state 
	// (if method is not selected, it can't be edited). This function will be
	// called when finished editing (see saveMethodButton function) or when 
	// user cancels editing (see cancelEditingButton function).
	// This function differs from markMethodAsSelected in that it changes
	// the image of the edit button. The other function turns on the edit 
	// button, but doesn't change the image
	target.childNodes[1].className = "method_selected";
	target.childNodes[1].childNodes[1].src = `${APP_ROOT}/static/imgs/box-checked.svg`;
	target.childNodes[1].childNodes[3].className = "selected_label";
	target.childNodes[3].src = `${APP_ROOT}/static/imgs/edit.svg`;
}

export function createMethodSelectors(met_div, methods, methods_parameters) {
	// This function will create the method selector. It will be called when 
	// user clicks on edit button (see editMethod function)
  //console.log(methods_parameters);
	for (var meth of methods) {
    if (meth in methods_parameters && methods_parameters[meth]["parameters"].length > 0) {
      met_div.innerHTML += `<div class="method_row" id="${meth}">
            <div class="method_selected">
              <img src="${APP_ROOT}/static/imgs/box-checked.svg"
              style="width: 20px; height: 20px;">
              <p width=100% float=left 
              class="selected_label">${meth}</p>
            </div>
            <img src="${APP_ROOT}/static/imgs/edit.svg" 
              class="edit_img"
            style="width: 15px; height: 15px; ">
            </div>`;
    } else {
      met_div.innerHTML += `<div class="method_row" id="${meth}">
            <div class="method_selected">
              <img src="${APP_ROOT}/static/imgs/box-checked.svg"
              style="width: 20px; height: 20px;">
              <p width=100% float=left 
              class="selected_label">${meth}</p>
            </div>
            </div>`;
    }
	}
}

export function selectToSubmit(methods_parameters) {
	// This function will be called when user clicks on submit button
	var met2cancel = document.getElementsByClassName("editing_method");
	if (met2cancel.length > 0) {
		markMethodAsNotEditing(met2cancel[0].parentNode);
	}
	var methods = document.getElementsByClassName("method_selected");
	var selected_methods = {};
	for (var method of methods) {
		var id = method.parentNode.id;
		selected_methods[id] = methods_parameters[id]["parameters"];
		//console.log(id, selected_methods[id]);
	}
	//console.log("Number of selected methods: "+Object.keys(selected_methods).length);
	return selected_methods;
}

////////////////////////////////////////////////////////////////////////
//                          Event listeners                           //
////////////////////////////////////////////////////////////////////////
export function selectMethod(evt, editor) {
	// This function is called when user clicks on a method selector (i.e. 
	// checkbox or label)

	if (editor.style.display == "block") {
		// User clicked on method selector while the editor is open, 
		// close it and cancel editing (and return to selected state)
		var previous_row = document.getElementById(editor.className);
		markMethodAsNotEditing(previous_row);
		closeMethodEditor(editor);
		return;
	}
	// This if clause is necessary because the user can click on the label, 
	// the checkbox or the div
	if (evt.target.tagName == "DIV") {
		var target = evt.target;
	}else {
		var target = evt.target.parentNode;
	}

	// Mark method as selected/unselected
	if (target["className"] == "method_selected") {
		// Method is already selected
		markMethodAsUnselected(target);
	}else if (target["className"] == "method_unselected") {
		// Method is already unselected
		markMethodAsSelected(target);
	}
	var error = document.getElementById("error-methods");
	error.style.display = "none";
}

export function editMethod(evt, methods_parameters) {
	// This function is called when user clicks on edit button 
	var row_target = evt.target.parentNode;
	var editing_method = row_target.id
	var editor = document.getElementById("method_editor");
	if (editor.className == editing_method) {
		// User clicked on edit button while the editor is already open, 
		// close it and cancel editing
		markMethodAsNotEditing(row_target);
		closeMethodEditor(editor);
	}else if (editor.className == "hidden") {
		// User clicked on edit button while the editor is not open, open it
		// and add method parameters
		markMethodAsEditing(row_target);
		openMethodEditor(editor, editing_method, methods_parameters);
		// Save button
		var save_button = document.getElementById("save_edit_button");
		save_button.addEventListener("click", (ev) => 
			saveMethodButton(editing_method, row_target, editor, 
				             methods_parameters));
		// Cancel button
		var cancel_button = document.getElementById("cancel_edit_button");
		cancel_button.addEventListener("click", (ev) => 
			cancelEditingButton(row_target, editor));
	} else {
		// User clicked on edit button while the editor is already open and 
		// another method is being edited, close editor and cancel editing
		var previous_row = document.getElementById(editor.className);
		markMethodAsNotEditing(previous_row);
		closeMethodEditor(editor);
	}
}

