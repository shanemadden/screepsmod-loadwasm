const utils = require.main?.require('@screeps/backend/lib/utils.js');
const fs = require('fs');
const path = require('path');

interface BotModules {
  [key: string]: string | {binary: string};
}

export default function (config: ServerConfig) {
  if (config.common) {
    // Replace the loadBot function in the default backend
    // https://github.com/screeps/backend-local/blob/1ffc31fc8f2af538c2cdfe92b45299d4a7b86f3e/lib/utils.js#L250
    // with one compatible with .wasm files
    utils.loadBot = function(name: string) {
      var dir = config.common.bots[name];
      if(!dir) {
        throw new Error(`Bot AI with the name "${name}" doesn't exist`);
      }
      var stat = fs.statSync(dir);
      if (!stat.isDirectory()) {
        throw new Error(`"${dir}" is not a directory`);
      }
      fs.statSync(path.resolve(dir, 'main.js'));
      var files = fs.readdirSync(dir), modules: BotModules = {};
      files.forEach((file: String) => {
        var m = file.match(/^(.*)\.js$/);
        if(m) {
          modules[m[1]] = fs.readFileSync(path.resolve(dir, file), {encoding: 'utf8'});
        } else {
          var wm = file.match(/^(.*)\.wasm$/);
          if(wm) {
            modules[wm[1]] = {
              binary: fs.readFileSync(path.resolve(dir, file), {encoding: 'base64'}),
            };
          }
        }
      });
      return utils.translateModulesToDb(modules);
    };
  }
}
