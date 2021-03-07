// util = require('util');
// var cacheable = require("./cache/cacheable");
// var cachehandle = require("./cache/cacheHandler");
// var microhostcache = require("./microhostcachehandlers/microhostpages");
// var testch = require("./microhostcachehandlers/testcachehandler");
// var cachemanager = require("./cache/cacheManager");
//
// class f extends cachehandle {
//   constructor(settings){
//     super(settings);
//   }
// }
//
// var testCacheManager = new cachemanager();
// var simulatedPagesCacheManager = new cachemanager();
//
//
//
// // var p = new f({"a":"b"});
// //
// // console.log(p.settings);
//
// var mhpc = new testch("testdb.json");
// var simulationCacheHandler = new testch("simulatedPages.json");
//
// testCacheManager.createCache("mytest", mhpc, "id", false);
// testCacheManager.createCache("microhost", simulationCacheHandler, "id", false);
// testCacheManager.createCache("vcache", undefined, "id", true);
//
// testCacheManager.initializeCache("mytest", function(err){
//   testCacheManager.getObjectById("mytest", 3, function(data, err){
//     console.log(data);
//
//
//     //
//     // data.name = "Nisha Barnes";
//     //
//     // testCacheManager.updateObjectById("mytest", 10, data, function (updateObj, err){
//     //   if (!err){
//     //     console.log(updateObj);
//     //   } else {
//     //     console.log(err);
//     //   }
//     // });
//
//     var newEntry = {
//       "name":"Kevin Jones"
//     };
//
//     testCacheManager.createObject("mytest", newEntry, function (returnObj, err){
//         if (!err){
//           console.log("New data entered");
//           console.log(returnObj);
//
//           setTimeout(function() {
//             testCacheManager.deleteObjectById("mytest", returnObj.id, function(delObj, errDel){
//               if (!errDel){
//                 console.log(delObj);
//               } else {
//                 // console.log(errDel);
//               }
//             });
//           }, 10);
//
//         } else {
//           console.log(err);
//         }
//     });
//   });
// });
//
// testCacheManager.initializeCache("microhost", function(err){
//   if (!err){
//     testCacheManager.getObjectById("microhost", 1, function(returnData, errData){
//       if (!errData){
//         console.log(returnData);
//       } else {
//         console.log(errData);
//       }
//     });
//   }
// });
//
//
// testCacheManager.initializeCache("vcache", function(err){
//   if (!err){
//     var testObject = {
//       "id":12345,
//       "value":"Hello"
//     };
//
//     testCacheManager.createObject("vcache", testObject, function(returnObj, err){
//       if (!err){
//         console.log(returnObj);
//
//         testCacheManager.getObjectById("vcache", 12345, function(getObj, err){
//           if (!err){
//             console.log(getObj);
//           } else {
//             console.log(err);
//           }
//         })
//       } else {
//         console.log(err);
//       }
//     });
//   } else {
//     console.log(err);
//   }
// });
// // mhpc.populateObjects(function (data) {
// //   console.log(data);
// // });

class test {
  functionA(){
    console.log("Outside");
    var hey = "Hello";
    function anotherFunction(iterate){

        console.log(iterate);
        console.log("Inside");
        console.log(hey);

        if (iterate < 5){
          anotherFunction(++iterate);
        }

    }
    anotherFunction(0);
  }
}

var g = new test();

g.functionA();


console.log(x);
