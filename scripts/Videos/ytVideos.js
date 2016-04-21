(function(){
angular.module('ytVideos', [])
	.factory('MainTitle', [function () {
		return {
			title:"YouTube Video Search Engine"
		};
	}])
	.filter('searchCity', function() {
	  	return function(items,search) {
			var filtered = [];
		    if(!search){return items;}
		    angular.forEach(items, function(item) {
		    	if(angular.lowercase(item.title).indexOf(angular.lowercase(search))!=-1)
		    	{
		    		filtered.push(item);
		    	}
		    });
		   return filtered;
		};
	})
	.config([function () {
		console.log("Event Module: config");
	}])
	.run([function () {
		console.log("Event Module: running");
	}])
	.controller('SearchVideoCtrl', ['$scope', '$location', 'MainTitle', 'Storage','searchService', function ($scope,$location,mainTitle,storage,searchService) 
	{
		var ctrl = this;
		ctrl.title = mainTitle.title;
		ctrl.SearchText = "";
		ctrl.SearchItems = [];//{id : {videoId :"hello"}}];
		ctrl.Location = "";
		ctrl.LocationRad = "";
		ctrl.sortVal = "date";

		ctrl.Radius= [{val:"", text:"None"},{val:"1km", text:"1 km"},{val:"10km", text:"10 km"},{val:"100km", text:"100 km"},{val:"1000km", text:"1000 km"}];
	     
		this.Search = function()
		{
			searchService.findLoc( ctrl.Location).then(
				function (data) 
				{
					var sLoc = undefined;
					var sLocRad = undefined;

					if (ctrl.LocationRad != "" && data != undefined )
					{
						sLoc= data;
						sLocRad = ctrl.LocationRad;
					}

					searchService.SearchItems(ctrl.SearchText, sLoc, sLocRad, ctrl.sortVal).then(
			 			function (data) {
			                ctrl.SearchItems =  data;
			            }, function (error) {
			            	ctrl.SearchItems = [];
			                console.log('Failed: ' + error)
			       		}
	       			);
				}, 
				function (error) {
				    console.log('Failed: ' + error)
				}
			);
			
			$location.$$search = {};
			$location.path('/home');
		};

		$scope.setFavorites = function(videoId)
		{
			if(ctrl.SearchItems.length>0){   
			    angular.forEach(ctrl.SearchItems, function(item, index) {
			   		if (angular.equals(item.id.videoId, videoId))
			   		{
			   			storage.addData(item);
			    		return;
			   		}
			    })
			}
		};
	}])

	.controller('FavouritesCtrl', ['$scope', 'Storage', function ($scope, storage) {
		var ctrl = this;
		ctrl.Favourites = storage.getData();//angular.fromJson(storage.getData()); //JSON.parse(storage.getData());

	    $scope.$on('broadcastFavourites', function() {    
	     	ctrl.Favourites = storage.getData();//angular.fromJson(storage.getData());
	    });

	   	$scope.removeFavorites = function(videoId)
		{
			storage.removeData(videoId);
		};
	}])


	.controller('VideoCtrl', ['$scope', '$stateParams', '$sce', 'searchService', function($scope, $stateParams,$sce,searchService) {
		var ctrl = this;
		var videoId  = $stateParams.videoId;
       	ctrl.videoUrl =$sce.trustAsResourceUrl("https://www.youtube.com/embed/"+videoId+"?autoplay=1");
       	ctrl.metaData ={};
       	ctrl.comments =[];

		searchService.GetMetaInfo(videoId).then(
			function (metadata) {
		    	ctrl.metaData =  metadata;
			}, function (error) {
			    console.log('Failed: ' + error)
			}
		);

		searchService.GetComments(videoId).then(
			function (cmnts) {
		    	ctrl.comments =  cmnts;
			}, function (error) {
			    console.log('Failed: ' + error)
			}
		);
  	}])

	.service('searchService', ['$q', function ($q) {

	    this.SearchItems = function (searchtext, loc, locRad, sortVal) {

			var deferr = $q.defer();
	     	var request = gapi.client.youtube.search.list({
			    q: searchtext,
			    part: 'snippet',
			    type:'video',
			   	order: sortVal,
			   	maxResults: 10,
			    location: loc,
			    locationRadius: locRad
			});
	        request.execute(function(response) {
	           	deferr.resolve(response.items);
	        });
	      	return deferr.promise;
	    };

	   	this.findLoc = function (loc) {
	    	var deferr = $q.defer();
	    	var locationXY = undefined;

	    	if ( loc != "" )
			{
				var  locSrvc = new google.maps.Geocoder(); 
		
				locSrvc.geocode({ 'address': loc }, function(results, status) {
			    	if (status === google.maps.GeocoderStatus.OK) {
				      	locationXY = results[0].geometry.location.lat() + "," + results[0].geometry.location.lng();
				      	deferr.resolve(locationXY);
			   		}   
			   		else
			   			deferr.resolve(locationXY);
				});
			}
			else
				{deferr.resolve(locationXY);}
			
	      	return deferr.promise;
	    };

	    this.GetMetaInfo = function (videoId) {
			var deferr = $q.defer();
	     	
		 	var request = gapi.client.youtube.videos.list({
		      	id: videoId,
		      	part: 'snippet,statistics'
		    });	
		 	request.execute(function(response) {
				//response.items.map(function(item) { return item.name }).join(',');
            	var getFirstItm = response.items[0];
            	var metaDat=getFirstItm.statistics;
            	metaDat.channelTitle = getFirstItm.snippet.channelTitle;

            	deferr.resolve(metaDat);
	        });
	      	return deferr.promise;
	    };

	     this.GetComments = function (videoId) {
			var deferr = $q.defer();
	     	
		 	var request = gapi.client.youtube.commentThreads.list({
		      	videoId: videoId,
		      	part: 'snippet'
		    });	
		 	request.execute(function(response) {
        		deferr.resolve(response.items);
        	});	
	   
	      	return deferr.promise;
	    };
	}])
	
	.service('Storage',  ['$window', '$rootScope', function($window, $rootScope) {
	 	var storageNm = "FavoriteStorage";
	 	var ls = $window.localStorage;
	 	var deserialized = [];

		this.getData= function() {
			////ls.setItem(storageNm,[])
			return getDeserialized();
		};
	
		this.addData = function(objFav) {
	      	deserialized = getDeserialized();
	     	if (findIndex(deserialized, objFav.id.videoId) === -1)
	     	{
	     		deserialized.push(objFav);
				getSerialized(deserialized);
	     	}
	      	return this;
	    };

		this.removeData = function(videoId) {
			deserialized = getDeserialized();
			var idx = findIndex(deserialized, videoId);
	     	if(  idx != -1)
	     	{
	     		deserialized.splice(idx, 1);
	     		getSerialized(deserialized);
	     	}
	      	return this;
	    };

		var getDeserialized = function ()
		{	
			var deserFav = [];
			if(ls)
			{
				var favItems= ls.getItem(storageNm);
				if (favItems)
					deserFav= angular.fromJson(ls.getItem(storageNm));
		 	}
		 	return deserFav;
		};

		var findIndex = function(items, videoId)
		{	
			var idx = -1;
			if(items.length>0){   
			    angular.forEach(items, function(item, index) {
			   		if (angular.equals(item.id.videoId, videoId))
			   		{
			   			idx = index;
			    		return;
			   		}
			    })
			}
			return idx;
		};

		var getSerialized = function(oFavArr)
		{	
			ls.setItem(storageNm, angular.toJson(oFavArr));
			$rootScope.$broadcast('broadcastFavourites');
		};		
	}])
	.directive('videoList', function () {
	   return {
	        restrict: 'E',  
	        scope: {
	        	Items :'=model',
	        	IsSearch :'@issearch'
	        },
	        replace: true,
	       	templateUrl: 'videoList.html'
	    }
	})
})();