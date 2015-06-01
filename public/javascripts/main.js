/* Copyright 2015 IBM Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

   See the License for the specific language governing permissions and
   limitations under the License. */

(function(){
	var account = angular.module('account', []);

	var mainController = account.controller('mainController', ['$scope', '$http', '$templateCache', function($scope, $http, $templateCache){
		var main = this;
		var documents = [];

		main.getAll = function(){
			$http({
				method: 'GET',
				url: '/getFeed',
				cache: $templateCache
			}).success(function(data, status){
				main.parseData(data);
			});
		};

		main.parseData = function(data){
			if(window.DOMParser){
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(data, "text/xml");
				var entries = xmlDoc.getElementsByTagName("entry");
				var entry;
				for(entry in entries){
					var entryJSON;
					entryJSON.name = entry.getElementsByTagName("title")[0].childNodes[0].nodeValue;
					main.documents.push(entryJSON);
				}
			} else {
				xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = false;
				xmlDoc.loadXML(data);
			}
		};

		main.getAll();
	}]);
})
