import { get_bp, get_metrics } from "./compute_metrics.js";
import { pin_method, redraw_svgs, 
  define_download_dialog } from "./edit_results_dom.js";
import { download_method_pdf, download_method_fasta, download_method_png, 
  download_method_svg, download_method_jpg, download_methods_pdf, 
  download_methods_fasta } from "./downloads.js";

export const sequence = document.querySelector("div#sequence").innerHTML;

document.getElementById("home_button").addEventListener("click", () => {
  window.location.href = APP_ROOT + "/";
});

// Initialize methods grid to be sortable
const methods = document.getElementById("methods_grid");
const sortable = new Draggable.Sortable(methods, {
    draggable: 'li',
    handle: '.dragbox'
});

// Initialize size selector
const size_selector = document.getElementById("size_selector");
var size = size_selector.value;

// Initialize radios and checkbox
const radios = document.getElementsByName("format");
//console.log("Radios created:", radios);
var rad_val = "both";

// Download dialog
const download_dialog = document.getElementById("download_dialog");

// Initialize methods
const methods_divs = {}
const methods_statuses = {}
const methods_dots = {}
const methods_f1 = {}
var method_pinned = "None";
const pinned_container = document.getElementById("pinned_method");

// Check if reference is provided by RNACentral
var ref = document.getElementById("rnacentral_id");
var is_rnacentral = false;
if (ref) {
  is_rnacentral = true;
}

// Initialize methods divs
for (var method of methods.children) {
    var id = method.id;
    methods_divs[id] = document.getElementById(id + "_stack");
    // All methods are waiting
    methods_statuses[id] = "waiting";
    // Initialize loaders
    methods_divs[id].innerHTML = `<div class="dragbox">
    <div class="loader_container">
		<div class="loader"></div><div class="loader_text">Waiting...
		</div></div><p><b>${id}</b></p></div>`;
    // Set size
    redraw_svgs(methods_divs, size, method_pinned, pinned_container);
}
var compute_f1 = false;
var wait_ref = false;

// Set checkbox callback
document.getElementById("comparison_checkbox").addEventListener(
  "change", () => {
    redraw_svgs(methods_divs, size, method_pinned, pinned_container);
  });

for (var method in methods_divs) {
  if (method == "Reference") { // if method is Reference
    compute_f1 = true;
    wait_ref = true;
    if (is_rnacentral) {
      methods_divs[method].children[0].children[1].innerHTML = `<b>Secondary 
        structure retrieved from RNACentral</b>`;
    } else {
      methods_divs[method].children[0].children[1].innerHTML = `<b>Secondary 
    structure provided by user</b>`;
    }
  } else { // if method is not Reference
    methods_f1[method] = -1;
  }
}

// Initialize help container
const help_container = document.getElementById("help_text");
if (compute_f1) {
  help_container.innerHTML = `
      <h1>Legend for comparisons</h1>
      <h2>Nucleotides colors</h2>
      <div class="help_item">
        <span class="color_box correct_nt"></span>
        Correct against reference structure
      </div>
      <div class="help_item">
        <span class="color_box incorrect_nt"></span>
        Incorrect against reference structure
      </div>
      <h2>Base pairs colors</h2>
      <div class="help_item">
        <span class="color_box true_positive_edge"></span>
        Base pair predicted correctly
      </div>
      <div class="help_item">
        <span class="color_box false_positive_edge"></span>
        Base pair predicted incorrectly
      </div>
      <div class="help_item">
        <span class="color_box false_negative_edge"></span>
        Base pair not predicted
      </div>
      <div class="help_item">
        Note: color strength is proportional to the time the base pair was
        predicted across all methods
      </div>`;
} else {
  help_container.innerHTML = `Color strength of base pairs on circular plot 
  (when show comparisons is checked) is proportional to the time the base pair 
  was predicted across all methods`;
}

var ref_bp = [];

// Initialize SSE (Server Sent Events)
var source = new EventSource(APP_ROOT + "/stream_results/" + sessionId);
var endConnection = false;
methods_dots["Reference"] = -1;
source.onmessage = (event) => {
  // Receive data
  var data = JSON.parse(event.data);

  for (var method in methods_divs) {
    // Method was not marked as done yet, but received done status
    if (data[method]["status"] == "done") {
      if (method != "Reference") {
        // Method is not Reference, add images and F1, if needed
        if (compute_f1) {
          methods_dots[method] = data[method]["dot"];
          // Define metrics container
          var metrics_div = `<div class='metrics'>
            <div class='f1'>F1: <div class='loader' 
            style="width: 20px; height: 20px;"></div> Computing...</div>
            <div class='sen'>Sensitivity: <div class='loader' 
            style="width: 20px; height: 20px;"></div> Computing...</div>
            <div class='ppv'>PPV: <div class='loader' 
            style="width: 20px; height: 20px;"></div> Computing...</div>
            </div>`;
        } else {
          var metrics_div = "";
        }
        // Define method div and add images received
        methods_divs[method].innerHTML = `<div class="dragbox">
        <div class="drag_img" alt="drag" width="15px"></div>
                <div class="images_container">
                  <div class=stem>${data[method]["svg"]}</div>
                  <div class=stem_c>not computed yet</div>
                  <div class=circ>${data[method]["circ"]}</div>
                  <div class=circ_c>not computed yet</div>
                </div></div><br />
              <div class="name_container"><div class="unpinned">
              </div><div class="download_button"></div>
                <b class="method_name">${method}</b></div>
          <p class="dot">${data[method]["dot"]}</p>${metrics_div}`;

        // Set method pin button callback
        methods_divs[method].querySelector(".unpinned").addEventListener(
          "click",
          (e) => {
            method_pinned = pin_method(
              e.target.parentElement.parentElement.parentElement.id, 
              method_pinned, pinned_container, methods_divs);
          }
        )

        // Set method download button callback
        methods_divs[method].querySelector(".download_button").addEventListener(
          "click", (e) => { 
            let method_id = e.target.parentElement.parentElement.parentElement.id;
            download_dialog.innerHTML = define_download_dialog(method_id);
            document.getElementById("download_dialog_ok_button").addEventListener("click", 
              (event) => {
                downloadMethod(method_id, sequence, methods_divs[method_id]);
                download_dialog.style.display = "none";
                download_dialog.innerHTML = ""; 
              })
            document.getElementById("download_dialog_cancel_button").addEventListener("click", 
              (event) => {
                download_dialog.style.display = "none";
                download_dialog.innerHTML = "";
              })
            download_dialog.style.display = "block";
          });
      } else {
        // Method is Reference, add images only
        ref_bp = get_bp(data[method]["dot"]);
        wait_ref = false;
        var name = "Reference structure retrieved from RNACentral";
        if (!is_rnacentral) {
          name = "Reference structure provided by user";
        }
        // Define Reference div and add images
        methods_divs[method].innerHTML = `<div class="dragbox">
        <div class="drag_img" alt="drag" width="15px"></div>
                <div class="images_container">
                  <div class=stem>${data[method]["svg"]}</div>
                  <div class=stem_c>not computed yet</div>
                  <div class=circ>${data[method]["circ"]}</div>
                  <div class=circ_c>not computed yet</div>
                </div></div><br />
              <div class="name_container"><div class="unpinned">
              </div><div class="download_button"></div>
                <b class="method_name">${name}</b></div>
                <p class="dot">${data[method]["dot"]}</p>`;

        // Set reference pin button callback
        methods_divs[method].querySelector(".unpinned").addEventListener(
          "click",
          (e) => {
            method_pinned = pin_method(e.target.parentElement.parentElement.parentElement.id, 
              method_pinned, pinned_container, methods_divs);
          }
        )

        // Set reference download button callback
        methods_divs[method].querySelector(".download_button").addEventListener(
          "click", (e) => { 
            let method_id = e.target.parentElement.parentElement.parentElement.id;
            download_dialog.innerHTML = define_download_dialog(method_id);
            document.getElementById("download_dialog_ok_button").addEventListener("click", 
              (event) => {
                downloadMethod(method_id, sequence, methods_divs[method_id]);
                download_dialog.style.display = "none";
                download_dialog.innerHTML = ""; 
              })
            document.getElementById("download_dialog_cancel_button").addEventListener("click", 
              (event) => {
                download_dialog.style.display = "none";
                download_dialog.innerHTML = "";
              })
            download_dialog.style.display = "block";
          }
        )
        // Pin Reference by default
        method_pinned = pin_method(method, method_pinned, pinned_container, 
          methods_divs);
      }
      methods_statuses[method] = "done";
      redraw_svgs(methods_divs, size, method_pinned, pinned_container);
    } else if (data[method]["status"] == "running") {
      // Method is running
      methods_divs[method].querySelector(".loader_text").innerHTML = "Running...";
    } else if (data[method]["status"].indexOf("Error") != -1) {
      // There was an error
      if (data[method]["circ"] != "not found") {
        // If there is a circular structure, sequence is folded, but there is 
        // not stem to show
        var circ = data[method]["circ"];
        var dw_button = `<div class="download_button"></div>`;
      }else {
        // If there is no circular structure, the method failed. No stem, no 
        // circular and no download
        var circ = "<div class='error'></div>";
        var dw_button = "";
      }
      if (compute_f1) {
        // If there is a dot bracket, add F1
        if (data[method]["dot"] != "") {
          methods_dots[method] = data[method]["dot"];
          methods_f1[method] = -1;
          // Define metrics container
          var metrics_div = `<div class='metrics'>
            <div class='f1'>F1: <div class='loader' 
            style="width: 20px; height: 20px;"></div> Computing...</div>
            <div class='sen'>Sensitivity: <div class='loader' 
            style="width: 20px; height: 20px;"></div> Computing...</div>
            <div class='ppv'>PPV: <div class='loader' 
            style="width: 20px; height: 20px;"></div> Computing...</div>
            </div>`;
        } else {
          methods_f1[method] = 0;
          var metrics_div = "";
        }
      } else {
        var metrics_div = "";
      }
      // Define method div when there is an error
      methods_divs[method].innerHTML = `<div class="dragbox">
            <div class="drag_img" alt="drag" width="15px"></div>
            <div class="images_container">
              <div class="stem"><div class="error">${data[method]["status"]}</div></div>
              <div class="stem_c"><div class="error">not computed yet</div></div>
              <div class="circ">${circ}</div>
              <div class="circ_c"><div class="error">not computed yet</div></div>
            </div></div><br />
            <div class="name_container">
              <div class="unpinned"></div>
              <b>${method}</b>
            </div>
        <p class="dot">${data[method]["dot"]}</p>${metrics_div}`;

      // Set error pin button callback
      methods_divs[method].querySelector(".unpinned").addEventListener(
        "click",
        (e) => {
          method_pinned = pin_method(
            e.target.parentElement.parentElement.parentElement.id, 
            method_pinned, pinned_container, methods_divs);
        }
      )
      
      redraw_svgs(methods_divs, size, method_pinned, pinned_container);
      if (data[method]["dot"] != "") {
        methods_dots[method] = data[method]["dot"];
      }
      methods_statuses[method] = "done";
    } else if (data[method]["status"] == "all_done") {
      // When all methods are done, colored results are received. Place them
      // in the right place and close the connection
      endConnection = true;
      if (data[method]["svg_c"] != "not found") {
        methods_divs[method].querySelector(".stem_c").innerHTML = data[method]["svg_c"];
        if (method == method_pinned) {
          pinned_container.querySelector(".stem_c").innerHTML = data[method]["svg_c"];
        }
      } else {
        methods_divs[method].querySelector(".stem_c").innerHTML = "<div class='error'>There was an error drawing the colored structure</div>";
        if (method == method_pinned) {
          pinned_container.querySelector(".stem_c").innerHTML = "<div class='error'>There was an error drawing the colored structure</div>";
        }
      }
      if (data[method]["circ_c"] != "not found") {
        methods_divs[method].querySelector(".circ_c").innerHTML = data[method]["circ_c"];
        if (method == method_pinned) {
          pinned_container.querySelector(".circ_c").innerHTML = data[method]["circ_c"];
        }
      } else {
        methods_divs[method].querySelector(".circ_c").innerHTML = "<div class='error'></div>";
        if (method == method_pinned) {
          pinned_container.querySelector(".circ_c").innerHTML = "<div class='error'></div>";
        }
      }
    } 

    // If method was marked as done, make sure F1 was computed
    if (methods_statuses[method] == "done") {
      if (methods_f1[method] > -1) {
        // F1 is already computed
        continue;
      }
      // F1 not computed, are we waiting for reference?
      if (!wait_ref && compute_f1 && method != "Reference") {
        console.log(method, "Computing F1");
        var [f1, ppv, sen] = get_metrics(ref_bp, 
          get_bp(methods_dots[method]));
        if (f1 != "ERROR") {
          methods_f1[method] = f1.toFixed(3);
          methods_divs[method].querySelector(".f1").innerHTML = `F1: ${methods_f1[method]}`;
          methods_divs[method].querySelector(".sen").innerHTML = `Sensitivity: ${sen.toFixed(3)}`;
          methods_divs[method].querySelector(".ppv").innerHTML = `PPV: ${ppv.toFixed(3)}`;
        } else {
          methods_f1[method] = 0;
          methods_divs[method].querySelector(".f1").innerHTML = `F1: error`;
          methods_divs[method].querySelector(".sen").innerHTML = `Sensitivity: error`;
          methods_divs[method].querySelector(".ppv").innerHTML = `PPV: error`;
        }
      }
    }

  } // End of for loop over methods
  if (endConnection) {
    console.log("Connection finished");
    source.close();
    document.getElementById("comparison_checkbox").disabled = false;
    document.getElementById("download_button").disabled = false;
  }
};

// Event listener for size selector. Set size for all images in grid
document.getElementById("size_selector").addEventListener("change", (event) => {
    size = event.target.value;
    redraw_svgs(methods_divs, size, method_pinned, pinned_container);
});

// Event listener for radio buttons
for (var radio of radios) {
  //console.log("Adding listener to", radio);
  radio.addEventListener("change", (event) => {
    rad_val = event.target.value;
    //console.log("Radius:", rad_val);
    redraw_svgs(methods_divs, size, method_pinned, pinned_container);
  });
}

// Event listener for download button for single method
export function downloadMethod(method_id, sequence, method_div) {
  var format = document.querySelector('input[name="download"]:checked').value;
  //console.log("Format:", format);
  if (format == "fasta") {
    download_method_fasta(method_id, sequence, method_div);
  } else if (format == "svg") {
    download_method_svg(method_id, method_div, rad_val);
  } else if (format == "png") {
    download_method_png(method_id, method_div, rad_val);
  } else if (format == "jpg") {
    download_method_jpg(method_id, method_div, rad_val);
  } else {
    download_method_pdf(method_id, sequence, method_div);
  }
}

// Event listener for download button
function downloadMethods() {
  var format = document.querySelector('input[name="download"]:checked').value;
  var checked = document.querySelectorAll(".methods_checkbox:checked");
  //console.log("Format:", format);
  var methods_list = [];
  for (var method of checked) {
    methods_list.push(method.id);
  }
  var title = "Results";
  //console.log(methods_list);
  if (document.getElementById("rnacentral_id")) {
    title = document.getElementById("rnacentral_id").innerHTML+"_Results";
  }
  if (format == "fasta") {
    download_methods_fasta(methods_list, title, sequence, pinned_container,
      methods_divs);
  } else {
    download_methods_pdf(methods_list, title, sequence, pinned_container,
      methods_divs, size, rad_val);
  }
}

// Event listener for download button
document.getElementById("download_button").addEventListener("click", (event) => {
  var methods_checkbox = "";
  if (method_pinned != "None") {
    methods_checkbox += `<input type="checkbox" id="${method_pinned}" class="methods_checkbox" 
    name="${method_pinned}" value="${method_pinned}" checked>
    <label for="${method_pinned}">${method_pinned}</label><br>`;
  }
  for (var method in methods_divs) {
    if (methods_divs[method].style.display != "none") {
      methods_checkbox += `<input type="checkbox" id="${method}" name="${method}" 
      class="methods_checkbox" value="${method}" checked>
        <label for="${method}">${method}</label><br>`;
    }
  }
  // Fill download dialog
  download_dialog.innerHTML = `
  <h1>All results</h1>
  <p>Methods to download:</p>
  ${methods_checkbox}<br>
  <p>Select to download:</p>
  <input type="radio" id="pdf" name="download" value="pdf" checked>
  <label for="pdf">Structure images (PDF)</label>
  <input type="radio" id="fasta" name="download" value="fasta">
  <label for="fasta">Predictions (FASTA)</label>
  <div class="button_container">
  <button id="download_dialog_cancel_button" class="secondary medium">Cancel</button>
  <button id="download_dialog_ok_button" class="primary medium">Download</button>
  </div>`;
  document.getElementById("download_dialog_ok_button").addEventListener("click", (event) => {
    downloadMethods();
    download_dialog.style.display = "none";
    download_dialog.innerHTML = "";
  })
  document.getElementById("download_dialog_cancel_button").addEventListener("click", (event) => {
    download_dialog.style.display = "none";
    download_dialog.innerHTML = "";
  })
  download_dialog.style.display = "block";
});
