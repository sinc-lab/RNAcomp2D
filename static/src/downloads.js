import { robotomono } from "./robotomono.js";

function generate_content(div, sequence, title, max_width) {
  const max_lines_char = 70;
  console.log("Generating content for:", title);
  const stem = div.querySelector(".stem");

  var imgs = [];
  if (stem.style.display != "none") {
    const st_obj = htmlToPdfmake(stem.innerHTML);
    //const stem_width = Math.min(stem.offsetWidth, max_width);
    st_obj[0].width = max_width;
    imgs.push(st_obj);
  }

  let circ = div.querySelector(".circ");
  if (circ.style.display != "none") {
    const circ_obj = htmlToPdfmake(circ.innerHTML);
    //const circ_width = Math.min(circ.offsetWidth, max_width);
    circ_obj[0].width = max_width;
    imgs.push(circ_obj);
  }

  var imgs_colums;
  if (imgs.length == 1) {
    var imgs_colums = imgs[0];
  } else if (imgs.length > 1) {
    imgs_colums = {columns: imgs};
  } else {
    imgs_colums = "";
  }

  let dot = div.querySelector(".dot");
  const dot_str = dot.innerHTML.replace(/\s/g, "").replace(/\t/g, "")
    .replace(/\n/g, "");
  sequence = sequence.replace(/\s/g, "").replace(/\t/g, "")
    .replace(/\n/g, "");
  var dot_lines = {};
  var seq_lines = {};
  if (dot_str.length < max_lines_char) {
    dot_lines = {text: dot_str, style: "dot"};
    seq_lines = {text: sequence, style: "dot"};
  } else {
    var dot_lines_char = "";
    var seq_lines_char = "";
    console.log(dot_str.length, sequence.length, max_lines_char);
    for (var i = 0; i < dot_str.length; i++) {
      dot_lines_char += dot_str[i];
      seq_lines_char += sequence[i];
      if (i % max_lines_char == max_lines_char - 1) {
        dot_lines_char += "\n";
        seq_lines_char += "\n";
      }
    }
    dot_lines = {text: dot_lines_char, style: "dot"};
    seq_lines = {text: seq_lines_char, style: "dot"};
  }

  var pdfContent = [
    {text: title, style: "header"},
    imgs_colums,
    {text: seq_lines},
    {text: dot_lines},
  ];

  return pdfContent;
}

export function download_method_fasta(title, sequence, div) {
  console.log("Downloading FASTA for method:", title);
  var dot = div.querySelector(".dot").innerHTML.replace(/\s/g, "").replace(/\t/g, "")
    .replace(/\n/g, "");
  var fastaContent = ">" + title + "\n" + sequence + "\n" + dot + "\n";
  const blob = new Blob([fastaContent], {type: "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = title + ".fasta";
  a.click();
  URL.revokeObjectURL(url);
  return;
}

export function download_methods_fasta(methods, title, sequence, pinned_container, 
  methods_divs) {
  console.log("Downloading methods:", methods);
  var fastaContent = "";
    if (pinned_container.style.display != "none" && pinned_container.innerHTML != "") {
      var pinned_method_name = pinned_container.parentNode
        .querySelector("#pinned_method_name").innerText;
      var pinned_method = methods_divs[pinned_method_name];
      var pinned_method_dot = pinned_method.querySelector(".dot").innerHTML
        .replace(/\s/g, "").replace(/\t/g, "").replace(/\n/g, "");
      var pinned_method_content = ">" + pinned_method_name + "\n" + sequence + "\n" + 
        pinned_method_dot + "\n";
    }
  for (var method in methods) {
    if (method != pinned_method_name) {
      var method_id = methods[method];
      var method_dot = methods_divs[method_id].querySelector(".dot").innerHTML
        .replace(/\s/g, "").replace(/\t/g, "").replace(/\n/g, "");
      var method_content = ">" + method_id + "\n" + sequence + "\n" + method_dot + "\n";
    }else {
      var method_content = pinned_method_content;
    }
    fastaContent += method_content;
  }
  
  const blob = new Blob([fastaContent], {type: "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = title + ".fasta";
  a.click();
  URL.revokeObjectURL(url);
  return;
}

function merge_svgs(div) {
  var stem = div.querySelector(".stem svg");
  var circ = div.querySelector(".circ svg");
  if (stem == null && circ == null) {
    return null;
  } else if (stem == null) {
    return circ;
  } else if (circ == null) {
    return stem;
  }
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const margin = 10;
  const stem_box = stem.getBoundingClientRect();
  const circ_box = circ.getBoundingClientRect();
  const stem_width = stem_box.width;
  const stem_height = stem_box.height;
  const circ_width = circ_box.width;
  const circ_height = circ_box.height;
  const full_width = stem_width + circ_width + 3*margin;
  const full_height = Math.max(stem_height, circ_height) + 2*margin;
  console.log("Dimensions:", full_width, full_height);
  svg.setAttribute("width", full_width);
  svg.setAttribute("height", full_height);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const clone_stem = stem.cloneNode(true);
  const clone_circ = circ.cloneNode(true);
  clone_stem.setAttribute("x", margin);
  clone_stem.setAttribute("y", margin);
  clone_stem.setAttribute("width", stem_width);
  clone_stem.setAttribute("height", stem_height);
  clone_circ.setAttribute("x", stem_width + 2*margin);
  clone_circ.setAttribute("y", margin);
  clone_circ.setAttribute("width", circ_width);
  clone_circ.setAttribute("height", circ_height);
  svg.appendChild(clone_stem);
  svg.appendChild(clone_circ);

  return svg;
}

export function download_method_svg(title, div, rad_val) {
  console.log("Downloading SVG for method:", title);
  if (rad_val == "svg") {
    var svg = div.querySelector(".stem svg");
  } else if (rad_val == "circ") {
    var svg = div.querySelector(".circ svg");
  } else {
    var svg = merge_svgs(div);
  }
  if (svg == null) {
    return;
  }
  var svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type: "image/svg+xml"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = title + ".svg";
  a.click();
  URL.revokeObjectURL(url);
  return;
}

export function download_method_jpg(title, div, rad_val) {
  console.log("Downloading JPG for method:", title);
  if (rad_val == "svg") {
    var svg = div.querySelector(".stem svg");
  } else if (rad_val == "circ") {
    var svg = div.querySelector(".circ svg");
  } else {
    var svg = merge_svgs(div);
  }
  if (svg == null) {
    return;
  }
  var svgData = new XMLSerializer().serializeToString(svg);
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  var img = new Image();
  const svgBlob = new Blob([svgData], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(svgBlob);

  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const jpgDataUrl = canvas.toDataURL('image/jpeg', 1.0);
    const link = document.createElement('a');
    link.href = jpgDataUrl;
    link.download = title + ".jpg";
    link.click();

    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function download_method_png(title, div, rad_val) {
  console.log("Downloading PNG for method:", title);
  if (rad_val == "svg") {
    var svg = div.querySelector(".stem svg");
  } else if (rad_val == "circ") {
    var svg = div.querySelector(".circ svg");
  } else {
    var svg = merge_svgs(div);
  }
  if (svg == null) {
    return;
  }
  var svgData = new XMLSerializer().serializeToString(svg);
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  var img = new Image();
  const svgBlob = new Blob([svgData], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(svgBlob);

  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const pngDataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = title + ".png";
    link.click();

    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function download_method_pdf(title, sequence, div) {
  pdfMake.vfs["RobotoMono.ttf"] = robotomono;
  pdfMake.fonts = {
    Roboto: {
      normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
      bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
      italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
      bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
    },
    RobotoMono: {
      normal: "RobotoMono.ttf",
      bold: "RobotoMono.ttf",
      italics: "RobotoMono.ttf",
      bolditalics: "RobotoMono.ttf"
    }
  };
  var image_width = 200;
  const lines = sequence.length / 70;
  console.log("Downloading PDF for method:", title);
  var pdfContent = generate_content(div, sequence, title, image_width);
  var page_width = image_width * 3;
  var page_height = image_width + 3 * 50 + Math.ceil(lines)*2 * 20;
  console.log("Page size:", page_width, page_height);

  //console.log(pdfContent);
  const docDefinition = {
    pageSize: {
      width: page_width,
      height: page_height
    },
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      dot: {
        fontSize: 12,
        font: "RobotoMono",
      }
    },
    content: pdfContent  
  };
  pdfMake.createPdf(docDefinition).download(title + ".pdf");
}

export function download_methods_pdf(methods, title, sequence, pinned_container, 
  methods_divs, size, rad_val, dot_val) {
  pdfMake.vfs["RobotoMono.ttf"] = robotomono;
  pdfMake.fonts = {
    Roboto: {
      normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
      bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
      italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
      bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
    },
    RobotoMono: {
      normal: "RobotoMono.ttf",
      bold: "RobotoMono.ttf",
      italics: "RobotoMono.ttf",
      bolditalics: "RobotoMono.ttf"
    }
  };
  console.log("Downloading methods:", methods);
  var image_width = 200;

  var methodsContents = [];
  // Pinned method
  if (pinned_container.style.display != "none" && pinned_container.innerHTML != "") {
    var pinned_method_name = pinned_container.parentNode
      .querySelector("#pinned_method_name").innerText;
    var pinned_method = methods_divs[pinned_method_name];
    var pinned_method_content = generate_content(pinned_container, sequence, 
      pinned_method_name, image_width);
  }

  // Other methods
  for (var method in methods) {
    if (method != pinned_method_name) {
      console.log(methods[method]);
      var method_id = methods[method];
      var method_content = generate_content(methods_divs[method_id], sequence, 
        method_id, image_width);
      methodsContents.push(method_content);
      methodsContents.push({text: "\n\n\n\n"});
    }else {
      methodsContents.push(pinned_method_content);
      methodsContents.push({text: "\n\n\n\n"});
    }
  }

  var docDefinition = { 
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    //pageSize: {
    //  width: page_width,
    //  height: page_height
    //},
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      dot: {
        fontSize: 12,
        font: 'RobotoMono',
      }
    },
    content: methodsContents
  };
  pdfMake.createPdf(docDefinition).download(title + ".pdf");
  return;
}

