/*
Mutant: Year Zero API script for GMs to secretly add rot-infested grub and water to players' inventories,
and to determine probability of a rot attack when grub or water is consumed.
*/

var mguilli = mguilli || {};
mguilli.rotten = (function () {
  
  function handleInput (msg) {
    var isApi = msg.type === 'api',
      args = msg.content.trim().splitArgs(),
      command, arg0, arg1;


      if (isApi) {
        command = args.shift().substring(1).toLowerCase();
        arg0 = args.shift() || '';
        arg1 = args.shift() || '';
        
        //Ensure there is one, and only one token selected
        // if (!msg.selected || msg.selected.length != 1) {
        //   sendChat("Error", "/w gm Wrong number of tokens selected!");
        //   return;
        // };

        // View rot-infested to total grub/water
        if (command == 'view') {
          //retrieve characterID from selected token (selected[0] is first obj in selected array)
          var allCharacters = findObjs({_type:'character',});
          log(allCharacters);

          var output = "";
          var charName, badGrub, goodGrub;

          _.each(allCharacters, function(char) {
            log(char);
            log(char.id); log(char._id); log(char["_id"]); log(char["id"]);  

            badGrub = getAttrByName(char.id, 'rot_grub');
            goodGrub = getAttrByName(char.id,'grub');

            output += '<p><strong>'+char.get('name')+": "+"</strong></p>"+
              "<p>"+badGrub+"/"+goodGrub+" [Change](!change) [Eat](!eat)"+'</p>';

          });
          sendChat("","/w gm "+"<div style='border: 1px solid black; background-color: white; padding: 3px 3px;'>"+output+"</div");
        };
      };
  };

  function registerEventHandlers() {
    on('chat:message', handleInput);
  };

  return {
    registerEventHandlers: registerEventHandlers
  };
}());

on('ready', function () {
  'use strict';

  mguilli.rotten.registerEventHandlers();
});