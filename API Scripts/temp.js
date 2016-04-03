var state = {'rot':
  {
    'char1': {'name':'Hal','water':'2','grub':1},
    'char2': {'name':'Sara','water':'3','grub':4}  
  } 
};

_.each(state.rot, function (char, key) {
  console.log(key+": "+JSON.stringify(char));
});

_.each(state.rot, function (char, key, list) {
  // console.log(char);
  // console.log(key);
  console.log(list);
})

var default = 'style="-webkit-border-radius: 10;-moz-border-radius: 10;border-radius: 10px;font-family: Arial;color: #ffffff;font-size: 13px;background:#148c0e;padding: 5px 5px 5px 5px;border: solid #1bbbf5 2px;text-decoration: none;"'; 