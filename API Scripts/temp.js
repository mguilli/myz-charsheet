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