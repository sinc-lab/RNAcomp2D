function convert_svg_to_png(svg, callback) {
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
  const svgUrl = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(svgUrl);
    callback(canvas.toDataURL("image/png"));
  };
  img.src = svgUrl;
}

function generate_content(div, sequence, title, max_width) {
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
  const dot_str = dot.innerHTML;

  var pdfContent = [
    imgs_colums,
    {text: title, style: "header"},
    {text: sequence},
    {text: dot_str}
  ];

  return pdfContent;
}

export function download_methods(methods, title, sequence, pinned_container, 
  methods_divs, size, rad_val, dot_val) {
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
    methodsContents.push(pinned_method_content);
    methodsContents.push({text: "\n\n"});
  }

  // Other methods
  for (var method in methods) {
    console.log(methods[method]);
    var method_id = methods[method];
    var method_content = generate_content(methods_divs[method_id], sequence, 
      method_id, image_width);
    methodsContents.push(method_content);
    methodsContents.push({text: "\n\n"});
  }

  var docDefinition = { 
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    //pageSize: {
    //  width: page_width,
    //  height: page_height
    //},
    content: methodsContents,
    styles: {
      header: {
        fontSize: 18,
        bold: true
      }
    }
  };
  pdfMake.createPdf(docDefinition).download(title + ".pdf");
  return;
}

export function download_method(title, sequence, div) {
  console.log("Downloading method:", title);
  const div_width = div.offsetWidth;
  const div_height = div.offsetHeight;
  const margin = 10;
  const text_margin = 20;
  const text_lines = Math.round(sequence.length / div_width) + 2;
  const page_width = div_width + margin * 2;
  const page_height = div_height + margin * 2 + 2 * text_lines * text_margin;
  console.log("page size:", page_width, page_height);

  var pdfContent = generate_content(div, sequence, title, div_width/2 - 2 * margin);

  //console.log(pdfContent);
  const docDefinition = {
    pageSize: {
      width: page_width,
      height: page_height
    },
    content: pdfContent,
    styles: {
		header: {
            fontSize: 18,
			bold: true
		}
	}
  };
  pdfMake.createPdf(docDefinition).download(title + ".pdf");
}
