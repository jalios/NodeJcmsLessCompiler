# NodeJcmsLessCompiler
Search less files in all properties files  of a jcms webapp and compile it to css files.

## Usage

First launch npm install on folder.

Then execute the getJcmsPropfiles.js with your jcms folder as argument : 

```
node getJcmsPropfiles.js C:/_DEV/_workspaces/JCMS10.x_ws/JCMS/webapps/en
```

This will lists all less files in your properties, and compile it to their mapped css output.