function getFile() {
    var file = document.getElementById("myfile");
    var text_input = document.getElementById("Aname");
    var txt = "";
    if ("files" in file) {
      if (file.files.length > 0) {
        for (var i = 0; i < file.files.length; i++) {
          var file1 = file.files[i];
          txt += file1.name;
          index = file1.name.search(/[*?+^${}[\]().|\\]/);
          name1 = txt.slice(0, index);
          console.log(file.files.length);
        }
      }
    }

    text_input.setAttribute("value", name1);
  }