var fs = require('fs'),
less = require('less'),
path = require('path'),
lessPropDeclarationRegex = new RegExp(/^channel\.less\.([^:]*):\s*(.*)$/, "gm"),
mainPluginPropDeclaration = new RegExp(/^channel\.main-plugin:\s*([\w]*)$/, "gm")
pluginXmlOrderRegex = new RegExp(/order="(\d+)"/, "g");

const WebInfPathSuffix = "/WEB-INF";
const pluginWebInfPathSuffix = "/plugins";
const pluginPropPathSuffix = "/properties";

//C:\_DEV\_workspaces\JCMS10.x_ws\JCMS\webapps\en\plugins
const util = require('util');
//https://github.com/mikaelbr/node-notifier

//TODO : get mainPlugin from custom.prop : channel.main-plugin

function JcmsPlugin(name, order, lessFiles) {
  this.name = name;
  this.order = order;
  this.lessFiles = lessFiles;
}

JcmsPlugin.prototype.print = function() {
  console.log("JcmsPlugin.prototype.print");
  console.log(JSON.stringify(this, null, 2))
};

JcmsPlugin.prototype.getOrder = function() {
  console.log("I'm the main plugin");
};

function getMainPlugin(rootPath) {
  console.log("Starting to parse custom.prop for mainplugin : " + rootPath + "/data/custom.prop \n");
  var mainPlugin;
  if (fs.existsSync(rootPath + "/data/custom.prop")) {
    var contents = fs.readFileSync(rootPath + "/data/custom.prop", 'utf8').toString();
    var match;

    while ((match = mainPluginPropDeclaration.exec(contents)) != null) {
      mainPlugin = match[1];
    }
  }

  if (mainPlugin) {
    console.log("Main Plugin found : " + mainPlugin);
  }

  return mainPlugin;
}

function getJcmsPropLessFiles(rootPath) {
  var jsonObj = {};

  console.log("Starting to parse jcms.prop: " + rootPath + "/jalios/jcms.prop \n");
  if (fs.existsSync(rootPath + "/jalios/jcms.prop")) {
    var contents = fs.readFileSync(rootPath + "/jalios/jcms.prop", 'utf8').toString();
    var match;
    while ((match = lessPropDeclarationRegex.exec(contents)) != null) {
      var lessFile = match[2];
      var cssTo = match[1];
      var lessFileArray = { lessFile : cssTo};
      jsonObj[lessFile] = cssTo;
    }
  }
  var count = Object.keys(jsonObj).length;
  console.log(count + " less files declarations have been found in jcms.prop");
  console.log("\n");

  // if (Object.keys(jsonObj).length > 0) {
  //   console.log(jsonObj);
  // }

  return jsonObj;
}

function getCustomPropLessFiles(rootPath) {
  var jsonObj = {};
  var count = 0;

  console.log("Starting to parse jcms.prop: " + rootPath + "/data/custom.prop \n");
  if (fs.existsSync(rootPath + "/data/custom.prop")) {
    var contents = fs.readFileSync(rootPath + "/data/custom.prop", 'utf8').toString();
    var match;
    while ((match = lessPropDeclarationRegex.exec(contents)) != null) {
      var lessFile = match[2];
      var cssTo = match[1];
      var lessFileArray = { lessFile : cssTo};
      jsonObj[lessFile] = cssTo;
      count++;
    }
  }

  var count = Object.keys(jsonObj).length;
  console.log(count + " less files declarations have been found in custom.prop");
  console.log("\n");

  return jsonObj;
}

function getJcmsPlugins(rootPath) {
  var pluginFolder = rootPath + pluginWebInfPathSuffix;

  console.log("Starting to parse all plugin.prop files in : " + pluginFolder + " \n");

  var plugins = [];
  var files = fs.readdirSync(pluginFolder);
  var count = 0;
  var pluginCount = 0;

  files.forEach(function(file) {
    var pluginPath = pluginFolder + "/" + file;
    // TODO var isDirectory = fs.stat(pluginPath).isDirectory();
    var pluginOrder = 0;
    var jsonObj = {};

    if (fs.existsSync(pluginPath + "/plugin.xml")) {
      var contents = fs.readFileSync(pluginPath + "/plugin.xml", 'utf8').toString();
      var result = pluginXmlOrderRegex.exec(contents);
      if (result && result[1]) {
        pluginOrder = result[1];
      }
    }

    if (fs.existsSync(pluginPath + pluginPropPathSuffix + "/plugin.prop")) {
      pluginCount++;
      var contents = fs.readFileSync(pluginPath + pluginPropPathSuffix + "/plugin.prop", 'utf8').toString();
      var match;
      while ((match = lessPropDeclarationRegex.exec(contents)) != null) {
        var lessFile = match[2];
        var cssTo = match[1];
        var lessFileArray = { lessFile : cssTo};
        jsonObj[lessFile] = cssTo;
        count++;
      }
    }

    if (Object.keys(jsonObj).length > 0) {
      var jcmsPlugin = new JcmsPlugin(file, pluginOrder, jsonObj);
      plugins.push(jcmsPlugin);
    }
  });

  console.log(count + " less files declarations have been found in " + pluginCount + " plugins.");
  console.log("\n");

  return plugins;
}



var exports = module.exports = {};
exports.sayHelloInEnglish = function() {
  return "HELLO";
};

/*
jcms.prop
plugin.prop (Without mainPlugin)
custom.prop
mainPlugin.prop
*/

exports.getAllJcmsPropLessFiles = function () {
  return getAllJcmsPropLessFiles();
}

function getAllJcmsPropLessFiles() {
  var rootPath = process.argv[2];
  var webInfPath = rootPath + WebInfPathSuffix;
  if (!rootPath) {
    console.warn("Missing root path. Add path as argument")
    return;
  } else {
    console.log("Scanning folder : " + rootPath + "\n");
  }

  if (!fs.existsSync(rootPath)) {
    console.log("Folder does not exists : " + rootPath);
    return;
  }

  var jcmsPropLessFiles = getJcmsPropLessFiles(webInfPath);
  var customPropLessFiles = getCustomPropLessFiles(webInfPath);
  var jcmsPluginList = getJcmsPlugins(webInfPath);
  var mainPluginName = getMainPlugin(webInfPath);
  var mainPlugin;
  var lessFiles = {};

  // 1 - Load jcms.prop files
  for (var lessItem in jcmsPropLessFiles) {
    if (jcmsPropLessFiles.hasOwnProperty(lessItem)) {
      lessFiles[lessItem] = jcmsPropLessFiles[lessItem];
    }
  }

  // 2 - Load plugin.prop files
  jcmsPluginList.forEach(function(itPlugin){
    if (itPlugin.name !== mainPluginName) {
      for (var lessItem in itPlugin.lessFiles) {
        if (itPlugin.lessFiles.hasOwnProperty(lessItem)) {
          lessFiles[lessItem] = itPlugin.lessFiles[lessItem];
        }
      }
    } else{
      mainPlugin = itPlugin;
    }
  });

  // 3 - Load custom.prop files
  for (var lessItem in customPropLessFiles) {
    if (customPropLessFiles.hasOwnProperty(lessItem)) {
      lessFiles[lessItem] = customPropLessFiles[lessItem];
    }
  }

  // 4 - Load main plugin.prop files
  if (mainPlugin) {
    for (var lessItem in mainPlugin.lessFiles) {
      if (mainPlugin.lessFiles.hasOwnProperty(lessItem)) {
        lessFiles[lessItem] = mainPlugin.lessFiles[lessItem];
      }
    }
  }
  // console.log(lessFiles);
  console.log(Object.keys(lessFiles).length + " less files have been found for all Jcms properties");


  // SAVE TO FILE
  // var json = JSON.stringify(lessFiles);
  //
  // fs.writeFile("jcms-less-files.json", json ,'utf8', function(err) {
  //   if(err) {
  //       return console.log(err);
  //   }
  //
  //   console.log("The file was saved!");
  // });

  for (var lessItem in lessFiles) {
    if (lessFiles.hasOwnProperty(lessItem)) {
      compileLESS(rootPath + "/" + lessItem, rootPath + "/" + lessFiles[lessItem]);
    }
  }

  // return lessFiles;
}

function compileLESS(from, to) {
  if (!from) {
    console.log("Wrong from" + from);
    return;
  }

  if (!to) {
    console.log("Wrong to" + to);
    return;
  }
  // less.writeError( "TODO");
  fs.readFile(from.trim(), function (err, data) {
    console.log("Compiling file : '" + from.split('\\').pop().split('/').pop() + "' to '" + to.split('\\').pop().split('/').pop() + "'");
    if (err){
      console.log("Compile failed" + err);
      return;
    }
    less.render(data.toString(), {
      compress: false,
      filename: from
    }, function (e, output) {
      if (!e) fs.writeFile(to.trim(), output.css);
      // console.log(to);
      //console.log(util.inspect(output, {showHidden: false, depth: null}))
      console.log("Converted Less: '" + to);
    });
  });
}

getAllJcmsPropLessFiles();
