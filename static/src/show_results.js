import { get_bp, get_f1 } from "./compute_metrics.js";

function resize_svgs(methods_divs, methods_graphs, methods_circs, size) {
  for (var method in methods_divs) {
    console.log("Resizing " + method);
    var imgs = methods_divs[method].querySelectorAll("svg");
    for (var img of imgs) {
      img.style.width  = size + "px";
      img.style.height = size + "px";
    }
  }
}

// Initialize methods grid to be sortable
const methods = document.getElementById("methods_grid");
const sortable = new Draggable.Sortable(methods, {
    draggable: 'li',
    handle: '.dragbox'
});

// Initialize size selector
const size_selector = document.getElementById("size_selector");
var size = size_selector.value;

// Initialize methods
const methods_divs = {}
const methods_statuses = {}
const methods_dots = {}
const methods_f1 = {}
const methods_graphs = {}
const methods_circs = {}

// Initialize methods divs
for (var method of methods.children) {
    var id = method.id;
    methods_divs[id] = document.getElementById(id + "_stack");
    // All methods are waiting
    methods_statuses[id] = "waiting";
    // Initialize loaders
    methods_divs[id].innerHTML = `<div class="dragbox"><div class="loader_container">
		<div class="loader"></div><div class="loader_text">Waiting...
		</div></div><p><b>${id}</b></p></div>`;
    // Set size
    resize_svgs(methods_divs, methods_graphs, methods_circs, size);
}
var compute_f1 = false;
var wait_ref = false;

for (var method in methods_divs) {
    if (method == "Reference") { // if method is Reference
        compute_f1 = true;
        wait_ref = true;
        methods_divs[method].children[0].children[1].innerHTML = `<b>Secondary 
		structure retrieved from RNACentral</b>`;
    }else { // if method is not Reference
      methods_f1[method] = -1;
    }
}

var ref_bp = [];

// Initialize SSE (Server Sent Events)
var source = new EventSource("/stream_results");
var endConnection = true;
methods_dots["Reference"] = -1;
source.onmessage = (event) => {
  // Receive data
  var data = JSON.parse(event.data);
  endConnection = true;

  for (var method in methods_divs) {
    // Method was not marked as done yet
    //console.log(method, data[method]["status"]);
    if (data[method]["status"] == "done") {
      if (method != "Reference") {
        // Method is not Reference, add images and F1, if needed
        if (compute_f1) {
          methods_dots[method] = data[method]["dot"];
          var f1div = `<div class='f1'>F1: <div class='loader' 
                    style="width: 20px; height: 20px;">
                    </div> Computing...</div>`;
        } else {
          var f1div = "";
        }
        methods_divs[method].innerHTML = `<div class="dragbox">
                <div class="images_container">${data[method]["svg"]}
                ${data[method]["circ"]}</div><br /><p><b>${method}</b>
                </p></div><p class="dot">${data[method]["dot"]}</p>${f1div}`;
      } else {
        // Method is Reference, add images only
        ref_bp = get_bp(data[method]["dot"]);
        wait_ref = false;
        methods_divs[method].innerHTML = `<div class="dragbox">
                <div class="images_container">${data[method]["svg"]}
                ${data[method]["circ"]}</div><br />
                <p><b>Reference structure from RNACentral</b></p></div>
                <p class="dot">${data[method]["dot"]}</p>`;
      }
      methods_graphs[method] = methods_divs[method].children[0]
        .children[0].children[0];
      if (data[method]["circ"] != "not found") {
        methods_circs[method] = methods_divs[method].children[0]
          .children[0].children[1];
      }
      methods_statuses[method] = "done";
      resize_svgs(methods_divs, methods_graphs, methods_circs, size);
    } else if (data[method]["status"] == "running") {
      // Method is running
      methods_divs[method].children[0].children[0].children[1]
        .innerHTML = `<div class="loader_text">Method is running...</div>`;
      endConnection = false;
    } else if (data[method]["status"].indexOf("Error") != -1) {
      // There was an error
      console.log("Error: " + method, data[method]["status"]);
      if (data[method]["circ"] != "not found") {
        var circ = data[method]["circ"];
      }else {
        var circ = "";
      }
      if (compute_f1) {
        methods_f1[method] = -1;
        var f1div = `<div class='f1'>F1: <div class='loader' 
              style="width: 20px; height: 20px;">
              </div> Computing...</div>`;
        endConnection = false;
      } else {
        var f1div = "";
      }
      methods_divs[method].innerHTML = `<div class="dragbox">
            <div class="failed"><div class="failed_text">
            <div class="errormsg">${data[method]["status"]}
            </div>${circ}</div></div>
            <p><b>${method}</b></p></div><p class="dot">${data[method]["dot"]}
            </p>${f1div}`;
      if (methods_divs) {
        methods_circs[method] = methods_divs[method].children[0]
          .children[0].children[1];
      }
      
      resize_svgs(methods_divs, methods_graphs, methods_circs, size);
      if (data[method]["dot"] != "") {
        methods_dots[method] = data[method]["dot"];
      }
      methods_statuses[method] = "done";
    //} else {
    //  console.log("Unknown status for method", method, data[method]["status"]);
    //  endConnection = false;
    }

    // If method was marked as done
    if (methods_statuses[method] == "done") {
      if (methods_f1[method] > -1) {
        // F1 is already computed
        continue;
      }
      // F1 not computed, are we waiting for reference?
      if (!wait_ref && compute_f1 && method != "Reference") {
          console.log(method, "Computing F1");
          var f1 = get_f1(ref_bp, get_bp(methods_dots[method]));
          methods_f1[method] = f1.toFixed(3);
          methods_divs[method].children[2].innerHTML = `<p class="f1">
                    F1: ${methods_f1[method]}</p>`;
      }
    }

  }
  if (endConnection) {
    console.log("Connection finished");
    source.close();
  }
};

// Event listener for size selector. Set size for all images in grid
size_selector.addEventListener("change", (event) => {
    size = event.target.value;
    resize_svgs(methods_divs, methods_graphs, methods_circs, size);
});
