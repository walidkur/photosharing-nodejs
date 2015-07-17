var photoApp = angular.module('photoApp');

photoApp.filter('tagFilter', function(){
  return function(input, arg) {
    var out = [];

    console.log(input);

    angular.forEach(input, function(tag){
      console.log(tag);
      if(tag.name.indexOf(arg) !== -1){
        out.push(tag);
      }
    })

    out.sort(function(a, b){
      if(a.weight > b.weight){
        return -1;
      }
      if(a.weight < b.weight){
        return 1;
      }
      return 0;
    })

    return out;
  }
})
