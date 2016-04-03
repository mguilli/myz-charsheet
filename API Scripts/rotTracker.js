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

      // Initialize rot inventory on state global object
      state.rot = state.rot || {};

      //template for output to gm chat window
      var messageOut = _.template("/w gm "+
        "<div style='border: 1px solid black; background-color: white; padding: 3px 3px;'>"+
          "<%= output %>"+
        "</div");


      if (isApi) {
        command = args.shift().substring(1).toLowerCase();
        arg0 = args.shift() || '';
        arg1 = args.shift() || '';
        arg2 = args.shift() || '';
        var output = '';

        log('command = '+command+' arg0 = '+arg0+' arg1= '+arg1+' arg2= '+arg2);

        if (command === 'rot') {
          // Make characters eligible to receive rot-infested water and grub
          if (arg0 === '--roster') {
            //retrieve all characters in game
            var allCharacters = findObjs({_type: 'character'});

            _.each(allCharacters,function (char) {
              log(char.get('name')+" "+char.id);
              if (state.rot[char.id]) {
                output += '<p>'+char.get('name')+' [Remove](!rot --rosterremove '+char.id+')'+'</p>';
              } else{
                output += '<p>'+char.get('name')+' [Add](!rot --rosteradd '+char.id+')'+'</p>';
              }
            });
            sendChat("",messageOut({output: output}));
          };

          if (arg0 === '--rosteradd') {
            if(!arg1) {
              sendChat('Error', '/w gm No character specified!');
              return;
            };

            if (!state.rot.hasOwnProperty(arg1)) {
              state.rot[arg1] = {};
              state.rot[arg1]['name'] = getAttrByName(arg1,'character_name');
              
              log('Name = '+getAttrByName(arg1, 'character_name'));

              state.rot[arg1].rotWater = 0;
              state.rot[arg1].rotGrub = 0;
              sendChat("Success",'/w gm '+getAttrByName(arg1,'character_name')+" has been added to the Rot Roster.");
            };
          };

          if (arg0 === '--rosterremove') {
            if (!arg1) {
              sendChat('Error', '/w gm No character specified!');
              return;
            };

            if(state.rot.hasOwnProperty(arg1)) {
              delete state.rot[arg1];
              sendChat("Success",'/w gm '+getAttrByName(arg1,'character_name')+" has been removed from the Rot Roster.");
            };

          };

          // View rot-infested to total grub/water
          if (arg0 === '--inventory') {
            if (_.isEmpty(state.rot)) {
              sendChat('Error', '/w gm No characters have been added to the Rot Roster yet!');
              return;
            };

            //Print out all characters in Rot Roster with action button options
            _.each(state.rot, function (char, key) {
              output += '<p><strong>'+char.name+':</strong></p>'+
                        '<p>  Grub: '+char.rotGrub+'/'+getAttrByName(key, 'grub')+' [Consume](!consume) [Add/Rem](!controller --change rotGrub '+key+')</p>'+
                        '<p>  Water: '+char.rotWater+'/'+getAttrByName(key, 'water')+' [Consume](!consume) [Add/Rem](!change)</p>';
            });

            sendChat('',messageOut({output: output}));
          };
        };

        // Change a character's Rot inventory
        // Example Format: !change rotGrub characterID newvalue
        // Where:
        // arg0 = resource type; arg1 = characterID; arg2 = newvalue
        // if (command === 'change') {
        //   if (arg0 === 'rotGrub' || arg0 === 'rotWater' && arg1 && arg2) {
        //     log("succesful inventory change command");
        //     state.rot[arg1][arg0] = arg2;
        //     sendChat('Success', '/w gm '+state.rot[arg1].name"'s "+arg0+" was changed to: "+arg2);

        //   } else {
        //     sendChat('Error','/w gm Invalid number of arguments.');
        //   };
        // };

        // sendChat functions to prompt user input
        // Example format: !controller --change resourceType charID
        // if (command === 'controller') {
        //   if (arg0 === '--change' && arg0 && arg1 && arg2) {
        //     log("Success on change trigger");
        //     // sendChat('',"!change "+arg1+" "+arg2+" ?{Change "+arg1+" to: |"+state.rot[arg2][arg1]+'}');
        //     sendChat('', 'You hit the button!!!');
        //     sendChat('', '!change ?{Test selection: |2}');
        //   } else {
        //     sendChat('Error','/w gm Invalid number of arguments.');
        //   };
        // }; 
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