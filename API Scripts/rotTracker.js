/*
Mutant: Year Zero API script for GMs to secretly add rot-infested grub and water to players' inventories,
and to determine probability of a rot attack when grub or water is consumed.
*/

var mguilli = mguilli || {};
mguilli.rotten = (function () {
  'use strict';
  
  function handleInput (msg_orig) {
    var msg = _.clone(msg_orig);

    var isApi = msg.type === 'api',
      args = msg.content.trim().splitArgs(),
      command, arg0, arg1, arg2;

    var ch = function (c) {
        var entities = {
            '<' : 'lt',
            '>' : 'gt',
            "'" : '#39',
            '@' : '#64',
            '{' : '#123',
            '|' : '#124',
            '}' : '#125',
            '[' : '#91',
            ']' : '#93',
            '"' : 'quot',
            '-' : 'mdash',
            ' ' : 'nbsp'
        };

        if(_.has(entities,c) ){
            return ('&'+entities[c]+';');
        }
        return '';
    };

    var buttonStyle = {
      default: 'style="-webkit-border-radius: 5;-moz-border-radius: 5;border-radius: 5px;font-family: Arial;color: #ffffff;font-size: 12px;background:dodgerblue;padding: 2px 7px 2px 7px;border: solid black 1px;text-decoration: none;"',
      dark: 'style="-webkit-border-radius: 5;-moz-border-radius: 5;border-radius: 5px;font-family: Arial;color: #ffffff;font-size: 12px;background:black;padding: 2px 7px 2px 7px;border: solid black 1px;text-decoration: none;"',
      danger: 'style="-webkit-border-radius: 5;-moz-border-radius: 5;border-radius: 5px;font-family: Arial;color: #ffffff;font-size: 12px;background:crimson;padding: 2px 7px 2px 7px;border: solid black 1px;text-decoration: none;"',
      die: 'style="background-color:#44c767;border:1px solid #18ab29;display:inline-block;cursor:pointer;color:#ffffff; font-family:Arial; font-size:10px; padding:2px 6px;text-decoration:none;"',
      failed: 'style="background-color:crimson;border:1px solid #18ab29;display:inline-block;cursor:pointer;color:#ffffff; font-family:Arial; font-size:10px; padding:2px 6px;text-decoration:none;"'
    };

    // Button styler: makeButton({link: href command, css: button.default, display: text to display});
    var makeButton = _.template('<a href="<%= link %>" <%= css %>><%= display %></a> ');

    // Roll result die styler
    var makeDie = _.template('<div <%= css %>'+'>'+'<%= value %>'+'</div>');

    // Initialize rot inventory on state global object
    state.rot = state.rot || {};

    // Match rot resource to general resource type
    var resource = {rotGrub: 'grub', rotWater: 'water'};

    //template for output to gm chat window
    var messageOut = _.template("/w gm "+
      "<div style='border: 1px solid black; background-color: white; padding: 3px 3px;'>"+
        "<%= output %>"+
      "</div>");


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
              output += '<p>'+char.get('name')+' '+makeButton({link: '!rot --rosterremove '+char.id, css: buttonStyle.danger, display: 'Remove'})+'</p>';
            } else{
              output += '<p>'+char.get('name')+' '+makeButton({link: '!rot --rosteradd '+char.id, css: buttonStyle.default, display: 'Add'})+'</p>';
            }
          });
          sendChat('Rot Roster',messageOut({output: output}));
        }

        if (arg0 === '--rosteradd') {
          if(!arg1) {
            sendChat('Error', '/w gm No character specified!');
            return;
          }

          if (!state.rot.hasOwnProperty(arg1)) {
            state.rot[arg1] = {};
            state.rot[arg1].name = getAttrByName(arg1,'character_name');
            
            log('Name = '+getAttrByName(arg1, 'character_name'));

            state.rot[arg1].rotWater = 0;
            state.rot[arg1].rotGrub = 0;
            sendChat("Success",'/w gm '+getAttrByName(arg1,'character_name')+" has been added to the Rot Roster."+
              makeButton({link: '!rot --roster', css: buttonStyle.default, display: 'Roster'}));
          }
        }

        if (arg0 === '--rosterremove') {
          if (!arg1) {
            sendChat('Error', '/w gm No character specified!');
            return;
          }

          if(state.rot.hasOwnProperty(arg1)) {
            delete state.rot[arg1];
            sendChat("Success",'/w gm '+getAttrByName(arg1,'character_name')+" has been removed from the Rot Roster."+
              makeButton({link: '!rot --roster', css: buttonStyle.default, display: 'Roster'}));
          }
        }

        // View rot-infested to total grub/water and make changes to inventory
        if (arg0 === '--inventory') {
          if (_.isEmpty(state.rot)) {
            sendChat('Error', '/w gm No characters have been added to the Rot Roster yet!');
            return;
          }
          var totalGrub = 0, totalWater = 0;
          //Print out all characters in Rot Roster with action button options
          _.each(state.rot, function (char, key) {
            //Retrieve total resources in character inventory
            totalGrub = getAttrByName(key,'grub');
            totalWater = getAttrByName(key, 'water');

            output += '<div style="border-top: 1px solid black"><p><strong>'+char.name+':</strong></p>'+
                      '<p>  Grub: '+char.rotGrub+'/'+getAttrByName(key, 'grub')+' '+                          
                        makeButton({link: '!rot-use rotGrub '+key+' '+ch('[')+'[?{Grub used: |'+char.rotGrub+'}d100]'+ch(']'), 
                          css: buttonStyle.danger, 
                          display: 'Use'})+
                        makeButton({link: '!rot-change rotGrub '+key+' ?{New Value: |'+char.rotGrub+'}', 
                          css: buttonStyle.default, 
                          display: 'Set Rot'})+
                        makeButton({link: '!rot-add',
                          css: buttonStyle.dark,
                          display: '+/-'})+
                      '</p>'+
                      '<p>  Water: '+char.rotWater+'/'+totalWater+' '+
                        makeButton({link: '!rot-use rotWater '+key+' '+ch('[')+'[?{Water used: |'+char.rotWater+'}d100]'+ch(']'), 
                          css: buttonStyle.danger, 
                          display: 'Use'})+
                        makeButton({link: '!rot-change rotWater '+key+' ?{New Value: |'+char.rotWater+'}', 
                          css: buttonStyle.default, 
                          display: 'Set Rot'})+
                        makeButton({link: '!rot-add',
                          css: buttonStyle.dark,
                          display: '+/-'})+
                      '</p></div>';
          });

          sendChat('Inventory',messageOut({output: output}));
        }
      }

      // Change a character's Rot inventory
      // Example Format: !change rotGrub characterID newvalue
      // Where:
      //arg0 = resource type; arg1 = characterID; arg2 = newvalue
      if (command === 'rot-change') {
        if (arg0 === 'rotGrub' || arg0 === 'rotWater' && arg1 && arg2) {
          log("succesful inventory change command");
          var resourceTotal = getAttrByName(arg1,resource[arg0]);
          var alertNotice = '';
          // Set state.rot[charID][resourceType] = to new value
          state.rot[arg1][arg0] = arg2;


          // Alert if new rot-infested resource units are greater than total units in character's inventory
          if (arg2 > resourceTotal) {
            alertNotice = '<p><strong>Rot inventory greater than total inventory!!!</strong></p>';
          }

          output = state.rot[arg1].name+"'s "+arg0+" was changed to: "+arg2+'/'+resourceTotal+alertNotice+' '+
            '<p>'+makeButton({link: '!rot --inventory', css: buttonStyle.default, display: 'Inventory'})+'</p>';

          sendChat('',messageOut({output: output}));

        } else {
          sendChat('Error','/w gm Invalid number of arguments.');
        }
      }

      // Handle consumption of rot infested resources
      // Usage: !rot-use rotGrub charID #ofUnits
      if (command === 'rot-use') {
        if (arg0 === 'rotGrub' || arg0 === 'rotWater' && arg1 && arg2) {

          var rollResults = msg.inlinerolls[0].results.rolls[0].results;
          var totalResource = Number(getAttrByName(arg1, resource[arg0]));
          var dirtyResource = Number(state.rot[arg1][arg0]);
          var cleanInventory = totalResource - dirtyResource;
          var infested = 0;
          var excess = 0;
          var probability = 0;
          var resultsMsg = '';
          var permRot = getAttrByName(arg1, 'permanent-rot') || 0;
          var newRotLevel = 0;
          output = '';

          if (rollResults.length > totalResource) {
            sendChat('Error', '/w gm More resources used than present in inventory!'+
              '<p>'+makeButton({link: '!rot --inventory', css: buttonStyle.default, display: 'Return to Inventory'})+'</p>');
            return;
          };

          // If number resources used exceeds amount of clean resources in inventory, then some infested resources is definitely used
          if (rollResults.length > cleanInventory && dirtyResource > 0) {
            // assign definitely infested used resources to infested var and discard excess roll results
            excess = rollResults.length - cleanInventory;
            infested += excess;
            rollResults = rollResults.slice(0,rollResults.length - infested);

            // lower infested and total resource inventory variables
            totalResource -= excess;
            dirtyResource -= excess;
            // add a failed die to the output string
            _.times(excess, function () {
              output += makeDie({css: buttonStyle.failed, value: '1'})+' ';
            });
          };

          log('rollResults: ');
          log(rollResults);

          _.each(rollResults, function (o) {
            probability = (dirtyResource / totalResource)*100;
            log('probability: '+probability);

            if (o.v <= probability) {
              output += makeDie({css: buttonStyle.failed, value: o.v})+' ';
              dirtyResource -= 1;
              totalResource -= 1;
              infested += 1;
            } else{              
              output += makeDie({css: buttonStyle.die, value: o.v})+' ';
              totalResource -= 1;
            };
          });

          // Decrement character rot inventory by number of infested results from die roll
          state.rot[arg1][arg0] -= infested;

          newRotLevel = Number(infested) + Number(getAttrByName(arg1, 'rot')) + Number(permRot);

          resultsMsg = '<div style="border-top: 1px solid black"><p><strong>'+state.rot[arg1].name+':</strong></p>'+
                      '<strong style="color:red;">'+infested+'</strong> infested <strong>'+resource[arg0]+'</strong>'+' have been removed from inventory'+
                      '<p>'+
                        'Roll results: '+output+
                      '</p>'+
                      '<p>'+(newRotLevel - infested)+' rot points already on character.</p>'+
                      '<p>'+
                        ((infested > 0) ? makeButton({link: '!rot-use --damage '+arg1+' '+ch('[')+ch('[')+newRotLevel+'d6<1'+ch(']')+ch(']'),
                                                 css: buttonStyle.danger, 
                                                 display: 'Roll for Damage'}): '')+
                        makeButton({link: '!rot --inventory', css: buttonStyle.default, display: 'Return to Inventory'})+
                      '</p>';

          sendChat('',messageOut({output: resultsMsg}));
        } else if (arg0 === '--damage') {
          // Handle damage rolls
          // Usage: !rot-use --damage charID [[(#infested+#rotpoints+#permanentRotpoints)d6<1]]
          var rotDamage = msg.inlinerolls[0].results.total;
          var damageRolls = msg.inlinerolls[0].results.rolls[0].results;
          var resultsMsg = '';

          _.each(damageRolls, function (o) {
            if (o.v === 1) {
              output += makeDie({css: buttonStyle.failed, value: o.v})+' ';
            } else{
              output += makeDie({css: buttonStyle.die, value: o.v})+' ';
            };
          });

          resultsMsg = '<div style="border-top: 1px solid black"><p><strong>'+state.rot[arg1].name+':</strong></p>'+
                      '<strong style="color:red;">'+rotDamage+'</strong> points of damage have been suffered!'+
                      '<p>'+
                        'Roll results: '+output+
                      '</p>'+
                      '<p>'+
                        makeButton({link: '!rot --inventory', 
                          css: buttonStyle.default, 
                          display: 'Return to Inventory'})+
                      '</p>';
          sendChat('',messageOut({output: resultsMsg}));          
        } else {
          sendChat('Error','/w gm Wrong number of arguments entered.');
        }
      }


      // Handle increment/decrement of resources instead of setting the value
      if (true) {}
    }
  }

  function registerEventHandlers() {
    on('chat:message', handleInput);
  }

  return {
    registerEventHandlers: registerEventHandlers
  };
}());

on('ready', function () {
  'use strict';

  mguilli.rotten.registerEventHandlers();
});