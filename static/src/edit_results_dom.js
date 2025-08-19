import { sequence, downloadMethod } from "./show_results.js";

export function define_download_dialog(method_id) {
  return ` 
  <h1>Download ${method_id}</h1>
  <p>Format:</p>
  <input type="radio" id="pdf" name="download" value="pdf" checked>
  <label for="pdf">PDF</label><br />
  <input type="radio" id="fasta" name="download" value="fasta">
  <label for="fasta">FASTA</label><br />
  <input type="radio" id="svg" name="download" value="svg">
  <label for="svg">SVG (images only)</label><br />
  <input type="radio" id="png" name="download" value="png">
  <label for="png">PNG (images only)</label><br />
  <input type="radio" id="jpg" name="download" value="jpg">
  <label for="jpg">JPG (images only)</label><br />
  <div class="button_container">
  <button id="download_dialog_cancel_button" class="secondary medium">Cancel</button>
  <button id="download_dialog_ok_button" class="primary medium">Download</button>
  </div>`;
}

export function pin_method(method, method_pinned, pinned_container, 
  methods_divs) {
  var pinned_method_name = pinned_container.parentNode
    .querySelector("#pinned_method_name").innerText;
  //console.log("Currently pinned method (hidden name):", pinned_method_name);
  //console.log("Method pinned is:", method_pinned, "and method to be pinned is:", method);
  if (pinned_method_name == method) {
    //console.log("method already pinned");

    // Method is already pinned, unpin it and remove from pinned div
    pinned_container.parentNode.style.display = "none";
    //console.log(methods_divs[method]);
    if (methods_divs[method].parentNode.className == "pinned_method") {
      methods_divs[method].parentNode.className = "unpinned_method";
      methods_divs[method].style.display = "block";
      methods_divs[method].querySelector(".pinned").className = "unpinned";
    }
    method_pinned = "None";
    pinned_container.parentNode.querySelector("#pinned_method_name").innerText = "None";
    pinned_container.style.display = "none";
  } else {
    pinned_container.style.display = "block";
    pinned_container.parentNode.style.display = "block";
    if (pinned_method_name != "None") { 
      //console.log("unpinning method", pinned_method_name);
      //console.log(methods_divs[method_pinned], methods_divs[method_pinned].parentNode);

      // Unpin previously pinned method
      if (methods_divs[method_pinned].parentNode.className == "pinned_method") {
        methods_divs[method_pinned].parentNode.className = "unpinned_method";
        methods_divs[method_pinned].style.display = "block";
        methods_divs[method_pinned].querySelector(".pinned").className = "unpinned";
      }
    }
    //console.log("pinning method", method);

    // Pin new method
    methods_divs[method].parentNode.className = "pinned_method";
    methods_divs[method].querySelector(".unpinned").className = "pinned";
    pinned_container.innerHTML = methods_divs[method].innerHTML;
    pinned_container.querySelector(".drag_img").remove();
    pinned_container.querySelector(".dragbox").style.cursor = "default";
    pinned_container.querySelector(".pinned").addEventListener("click", (e) => {
      method_pinned = pin_method(method_pinned, method_pinned, pinned_container, methods_divs);
    })
    pinned_container.querySelector(".download_button").addEventListener("click", (e) => {
      let method_id = e.target.parentElement.querySelector(".method_name").innerText;
      download_dialog.innerHTML = define_download_dialog(method_id);
      var pinned_method_div = document.getElementById("pinned_method");
      document.getElementById("download_dialog_ok_button").addEventListener("click", 
        (event) => {
          downloadMethod(method_id, sequence, pinned_method_div);
          download_dialog.style.display = "none";
          download_dialog.innerHTML = ""; 
        })
      document.getElementById("download_dialog_cancel_button").addEventListener("click", 
        (event) => {
          download_dialog.style.display = "none";
          download_dialog.innerHTML = "";
        })
      download_dialog.style.display = "block";
    })
    methods_divs[method].style.display = "none";
    method_pinned = method;
    pinned_container.parentNode.querySelector("#pinned_method_name").innerText = method;
  }
  //console.log("Currently pinned method:", method_pinned);
  return method_pinned
};

export function redraw_svgs(methods_divs, size, rad_val, dot_val, method_pinned, pinned_container) {
  // TODO: fix this when there are error messages
  for (var method in methods_divs) {
    var imgs = methods_divs[method].querySelectorAll("svg");
    for (var img of imgs) {
      img.style.width  = size + "px";
      img.style.height = size + "px";
    }
    var stem = methods_divs[method].querySelector("div.stem");
    var circ = methods_divs[method].querySelector("div.circ");
    let dot = methods_divs[method].querySelector("p.dot");
    let nimgs = 0;
    if (rad_val != "circ") {
      if (stem){
        stem.style.display = "block";
        nimgs += 1;
      }
    } else {
      if (stem){
        stem.style.display = "none";
      }
    }
    if (rad_val != "svg") {
      if (circ){
        if (circ.childNodes[0].className == "error") {
          circ.style.display = "none";
        }else {
          circ.style.display = "block";
          nimgs += 1;
        }
      }
    } else {
      if (circ){
        circ.style.display = "none";
      }
    }
    if (dot) {
      if (nimgs == 0) {
        nimgs = 1;
        //console.log(stem);
        if (stem.childNodes[0].className == "error") {
          stem.style.display = "block";
        }
      }
      let new_width = size * nimgs + 30;
      dot.style.width = new_width + "px";
      if (dot_val) {
        dot.style.display = "block";
      } else {
        dot.style.display = "none";
      }
    }
  }
  // Redraw pinned method
  //console.log("Pinned method: " + method_pinned);
  if (method_pinned != "None") {
    var pinned_container = document.getElementById("pinned_method");
    var imgs = pinned_container.querySelectorAll("svg");
    var nimgs = 0;
    for (var img of imgs) {
      img.style.width  = size + "px";
      img.style.height = size + "px";
    }
    var stem = pinned_container.querySelector("div.stem");
    var circ = pinned_container.querySelector("div.circ");
    let dot = pinned_container.querySelector("p.dot");
    nimgs = 0;
    if (rad_val != "circ") {
      if (stem){
        stem.style.display = "block";
        nimgs += 1;
      }
    } else {
      if (stem){
        stem.style.display = "none";
      }
    }
    if (rad_val != "svg") {
      if (circ){
        if (circ.childNodes[0].className == "error") {
          circ.style.display = "none";
        }else {
          circ.style.display = "block";
          nimgs += 1;
        }
      }
    } else {
      if (circ){
        circ.style.display = "none";
      }
    }
    if (dot) {
      if (nimgs == 0) {
        nimgs = 1;
        if (stem.childNodes[0].className == "error") {
          stem.style.display = "block";
        }
      }
      let new_width = size * nimgs + 30;
      dot.style.width = new_width + "px";
      if (dot_val) {
        dot.style.display = "block";
      } else {
        dot.style.display = "none";
      }
    }
  }
}
