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

	account.controller('mainController', ['$scope', '$http', '$templateCache', function($scope, $http, $templateCache){
		var main = this;
		main.entry = [];

		main.getAll = function(){
			$http({
				method: 'GET',
				url: '/getFeed',
				cache: $templateCache
			}).success(function(data, status){
				main.entry = [];
				main.parseData(data);
			});
		};

		main.parseData = function(data){
			var xmlDoc = $.parseXML(data);
			var $xml = $(xmlDoc);
			var $entry = $xml.find("entry");
			var $title = $entry.find("title");
			var $uuid = $entry.find("uuid");
			for(var i = 0; i < $title.length; i++){
				main.entry.push({name: $title[i].innerHTML, docid: $uuid[i].innerHTML});
			}
		};

		main.delete = function(docid) {
			$http({
				url: '/delete/' + docid,
				method: 'POST',
				cache: $templateCache
			}).success(function(data, status){
				main.getAll();
			});
		};

		main.getAll();
	}]);
})();
