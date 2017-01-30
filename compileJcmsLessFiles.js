var fs = require('fs'), // File system
less = require('less'), // Less compiler
lessPropDeclarationRegex = new RegExp(/^channel\.less\.(.*)[:|=](.*)$/, "gm"), // Regex for less files declaration in properties files
mainPluginPropDeclaration = new RegExp(/^channel\.main-plugin:\s*([\w]*)$/, "gm") // Regex for main plugin declaration in properties files
pluginXmlOrderRegex = new RegExp(/order="(\d+)"/, "g") // Regex for plugin order declaration in plugin.xml
rootPath = process.argv[2]; // Parameter which represents the jcms workspace folder to compile

const WebInfPathSuffix = "/WEB-INF";
const pluginWebInfPathSuffix = "/plugins";
const pluginPropPathSuffix = "/properties";

/**
 * JcmsPlugin object representing a JCMS Plugin
 */
function JcmsPlugin(name, order, lessFiles) {
  this.name = name;
  this.order = order;
  this.lessFiles = lessFiles;
}

/**
 * PRetty print of the JcmsPlugin object
 */
JcmsPlugin.prototype.print = function() {
  console.log("JcmsPlugin.prototype.print");
  console.log(JSON.stringify(this, null, 2))
};

/**
 * Search the main plugin declaration in given JCMS custom.prop file
 * @param rootPath the root path where to search for the custom.prop file
 * @return the mainPlugin name
 */
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

/**
 * Search for less files to compile in given JCMS jcms.prop file
 * @param rootPath the root path where to search for the jcms.prop file
 * @return json array of less files
 */
function getJcmsPropLessFiles(rootPath) {
  var jsonObj = {};

  console.log("Starting to parse jcms.prop: " + rootPath + "/jalios/jcms.prop \n");
  if (fs.existsSync(rootPath + "/jalios/jcms.prop")) {
    var contents = fs.readFileSync(rootPath + "/jalios/jcms.prop", 'utf8').toString();
    var match;
    while ((match = lessPropDeclarationRegex.exec(contents)) != null) {
      var lessFile = match[2].trim();
      var cssTo = match[1];
      var lessFileArray = { lessFile : cssTo};
      jsonObj[lessFile] = cssTo;
    }
  }
  var count = Object.keys(jsonObj).length;
  console.log(count + " less files declarations have been found in jcms.prop");
  console.log("\n");

  return jsonObj;
}

/**
 * Search for less files to compile in given JCMS custom.prop file
 * @param rootPath the root path where to search for the custom.prop file
 * @return json array of less files
 */
function getCustomPropLessFiles(rootPath) {
  var jsonObj = {};
  var count = 0;

  console.log("Starting to parse jcms.prop: " + rootPath + "/data/custom.prop \n");
  if (fs.existsSync(rootPath + "/data/custom.prop")) {
    var contents = fs.readFileSync(rootPath + "/data/custom.prop", 'utf8').toString();
    var match;
    while ((match = lessPropDeclarationRegex.exec(contents)) != null) {
      var lessFile = match[2].trim();
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


/**
 * Search for all plugins of the given JCMS folder
 * @param rootPath the root path of plugins
 * @return array of JcmsPlugin
 */
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
        var lessFile = match[2].trim();
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

/**
 * Parse following files to retrieve less files to compile :
 * - jcms.prop
 * - plugin.prop (Without mainPlugin)
 * - custom.prop
 * - mainPlugin.prop
 * @return json array of less files
 */
function getAllJcmsPropLessFiles() {
  var webInfPath = rootPath + WebInfPathSuffix;
  
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
  console.log(Object.keys(lessFiles).length + " less files have been found for all Jcms properties");

  return lessFiles;
}

/**
 * Compiles JCMS Less files and write result of the compilation in result.log file
 * @return status 0 if OK or 1 if failed
 */
function compileJCMSLess() {
  if (!rootPath) {
    console.log("Root path is missing.");
    return 1;
  }

  if (!fs.existsSync(rootPath)) {
    console.log("Folder does not exists : " + rootPath);
    return 1;
  }

  var lessFiles = getAllJcmsPropLessFiles();
  var compileLessResult = {};

  var finalStatus = {};
  var okFileCount = 0;
  var failedFileCount = 0;
  var failedFileList = [];

  console.log("Starting Less compilation...\n");

  for (var lessItem in lessFiles) {
    if (lessFiles.hasOwnProperty(lessItem)) {
      var result = compileLESS(rootPath + "/" + lessItem.trim(), rootPath + "/" + lessFiles[lessItem]);
      if (result && result.status === "OK") {
        okFileCount++;
      } else {
        failedFileList.push(result.from);
        failedFileCount++;
      }

      compileLessResult[lessItem.trim()] = result;
    }
  }

  compileLessResult['finalStatus'] = {'okCount':okFileCount,'failedFileCount':failedFileCount, 'failedFileList': failedFileList};

  console.log("Less compilation has finished : " + okFileCount + " files have been compiled, " + failedFileCount  + " files have failed.");
  console.log(failedFileList);
  console.log("\n");

  fs.writeFile("result.log", JSON.stringify(compileLessResult, null, 2), function(err) {
      if(err) {
        return console.log(err);
      }
      console.log("Result has been saved in result.log file.");
  });

  return failedFileCount > 0 ? 1 : 0;
}

/**
 * Compiles JCMS Less files
 * @param from : the from less file to compile
 * @param to : the to css file to compile
 * @return a json object representing status of less compilation
 */
function compileLESS(from, to) {
  var result = {};

  if (!from) {
    console.log("Wrong from" + from);
    result = {'from':from, 'to':to,'status':"FROM MISSING"};
    return;
  }

  if (!to) {
    console.log("Wrong to" + to);
    result = {'from':from, 'to':to,'status':"TO MISSING"};
    return;
  }

  if (!fs.existsSync(from)) {
    console.log("From file doesn't exists : " + from);
    result = {'from':from, 'to':to,'status':"FROM MISSING"};
    return result;
    return;
  }

  var contents = fs.readFileSync(from.trim());

  less.render(contents.toString(), {
    compress: false,
    filename: from,
    syncImport: true
  }, function (e, output) {
    if (!e){
      fs.writeFileSync(to.trim(), output.css);
      // console.log("Converted Less: '" + to);
      result = {'from':from,'to':to,'status':"OK"};
    } else{
      // console.log(e);
      // result += e;
      result = {'from':from,'to':to,'status':"FAILED", 'errorLog' : e};
    }
  });

  return result;
}

//Execute
compileJCMSLess();
