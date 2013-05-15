exports.regionReports = function(req, res){
	// Lookup what city it is, then lookup reports for that city in increasing order.
	var cityID = req.params.id;
	var Region = mongoose.connection.model("Region");

	Region.findById(cityID, function (err, region){
		if (err){
			console.log(err);
			res.render('servicemessage', {title:"We had an issue generating results for this region."});
		}else{

			var Report = mongoose.connection.model("Report");

			Report.find({region:region._id}).sort('-date').exec(function(err, reports){
				// We now have all reports. let's build a table to display outputs.
				if (err){
					console.log(err);
					res.render('servicemessage', {title:defaultDBErrorMessage});
				}else{

					for (var i = reports.length - 1; i >= 0; i--) {
						reports[i].statusIcon = require('../config/possibleLineStatuses.js').toImage(reports[i].status);
						reports[i].statusDescription = require('../config/possibleLineStatuses.js').toDescription(reports[i].status)
					};

					// add status descriptions
					res.render("cityReport", {title:"Reports for "+ region.name, reports:reports})
				}
			});
		}
	});

}

exports.feeds = function(req, res){
	res.render('servicemessage', {title:"Section coming soon."});
}

exports.index = function(req, res){
	var Region = mongoose.connection.model("Region");

	Region.find({}, function(err, regions){
		if (err) {
			console.log(err);
			res.render('servicemessage', {title:defaultDBErrorMessage});
		}else{
			var formattedRegions = [];
			require('./index.js').find(regions, 0, res, formattedRegions, function(res){
				res.render('index', { title:'Landlines', regions:formattedRegions});
			});
		}
	});
}

exports.find = function (regions, iterator,res, formattedRegions, callback){
	var Report = mongoose.connection.model("Report");
	var region = regions[iterator];

	Report.find({'_id': {$in:region.reports}}, function(err, allReports){
		if (err){
			console.log(err);
			res.render('servicemessage', {title:defaultDBErrorMessage});
			return;
		}else{
			formattedRegion = [];
			formattedRegion.push(region["name"]);
			formattedRegion.push(region["latitude"]);
			formattedRegion.push(region["longitude"]);
			var cityReport = require("../config/statusAlgorithm.js").cityReport(region, allReports);
			var imageForReport = require("../config/statusAlgorithm.js").imageForStatus(cityReport);
			formattedRegion.push(cityReport);
			formattedRegion.push(imageForReport);
			formattedRegion.push(region._id);
			formattedRegions.push(formattedRegion);
		}
		if (iterator < regions.length-1) {
			require('./index.js').find(regions, iterator+1, res, formattedRegions, callback);
		}else{
			callback(res);
		}
	});
}

exports.submit = function(req, res){
	var Region = mongoose.connection.model("Region");

	Region.find({}).sort('name').exec(function(err, regions){
		if (err) {
			console.log(err);
			res.render('servicemessage', {title:defaultDBErrorMessage});
		}else{
			var possibleStatuses = require('../config/possibleLineStatuses.js').possibleOptions();
			var statuses = [];
			for (var i = 0; i <= possibleStatuses.length - 1; i++) {
				statuses.push({indexValue:i, name:possibleStatuses[i]});
			};

			res.render('submit', {title:"Submit", statuses:statuses, regions:regions});
		}	
	});
}


exports.reports = function(req, res){
	var Report = mongoose.connection.model("Report");
	var Region = mongoose.connection.model("Region");

	Report.find({}, function(err, reports){
		if (err) {
			console.log(err);
			res.render('servicemessage', {title:defaultDBErrorMessage});
		}else{
			Region.find({}, function(err, regions){
				if (err) {
					console.log(err);
					res.render('servicemessage', {title:defaultDBErrorMessage});
				}else{
					res.render('report', {title:'Manage the reports', reports:reports, regions:regions});
				}
			});
		}
	}).limit(10);
}

exports.regions = function (req, res){

	var Region = mongoose.connection.model("Region");

	Region.find({}, function(err, regions){
		if (err) {
			console.log(err);
			res.render('servicemessage', {title:defaultDBErrorMessage});
		}else{
			res.render('regions', {title:'Manage the regions', regions: regions});
		}
	});
}

exports.reportSubmit = function(req, res){

	if (typeof req.body["region"] != "undefined" && typeof req.body["status"] != "undefined" && typeof req.body["comment"] != "undefined" && req.body["status"] != "" && req.body["region"] != "" && typeof req.body["phonenumber"] != "undefined") {
		var Region = mongoose.connection.model("Region");

		Region.findOne({_id:req.body["region"]},function (err, region) {
			if (err){
				console.log(err);
	  			res.render('servicemessage', {title:defaultDBErrorMessage});
	  		}else{
	  			if (region != null && typeof region != "undefined"){
					var statusNumber = parseInt(req.body["status"]);
					if (!isNaN(statusNumber)) {
						var Report = mongoose.connection.model("Report");
						var sanitizer = require("sanitizer");
						var comment = sanitizer.sanitize(req.body["comment"]);
						var phonenumber = sanitizer.sanitize(req.body["phonenumber"]);
	  					var report = new Report({status:statusNumber,name:"", region:region._id, comments:comment, number:phonenumber});
	  					report.save(function (err) {
		  					if (err){
		  						console.log(err);
		  						res.render('servicemessage', {title:defaultDBErrorMessage});
		  					}else{
		  						region.reports.push(report);
		  						region.save(function (err) {
		  							if (err){
		  								console.log(err);
		  								res.render('servicemessage', {title:defaultDBErrorMessage});
		  							}else{
		  								if (statusNumber == 0) {
		  									res.render('servicemessage', {title:"Thanks for reporting. We hope you had a good call with "+region.name});
		  								}else{
		  									res.render('servicemessage', {title:"Thanks for reporting. We are sorry to hear you couldn't reach "+region.name});
		  								}
		  								//Add to main information feed

		  								var FeedItem = mongoose.connection.model("FeedItem");
		  								var feedItem = new FeedItem({title:"We have a new report of a call to "+region.name+".", description:require('../config/possibleLineStatuses.js').toDescription(statusNumber), imageURL:require('../config/possibleLineStatuses.js').toImage(statusNumber), date:report.date});
		  								feedItem.save(function (err) {
		  									if (err){
		  										console.log("Couldn't save to feed");
		  									}
		  								});
		  								// If the service doesn't scale well, we could cache the currentStatuses and here clear the cache for that region.
		  							};
		  						});
							}
						})
					}else{
						res.render('servicemessage', {title:"We are having issues determining how your called went. Please try again."});
					}				  				
	  			}else{
	  				res.render('servicemessage', {title:"It appears that region has been deleted"});
	  			}
	  		}

		});

	}else{
		res.render('servicemessage', {title:"Sorry, your report was not complete enough"});
	}
}

exports.regionsSubmit = function(req, res){

	if (typeof req.body["lat"] != "undefined" && typeof req.body["lng"] != "undefined" && typeof req.body["name"] != "undefined" && req.body["lng"] != "" && req.body["lat"] != "" && req.body["name"]!= "") {
		
		var Region = mongoose.connection.model("Region");

		Region.findOne({name:req.body["name"]},function (err, region) {
			if (err){
				console.log(err);
	  			res.render('servicemessage', {title:defaultDBErrorMessage});
	  		}else{
				if(region){
					console.log("Trying to add a duplicate region.")
					res.render('servicemessage', {title:"That region already exists."});
				}else{
					var newRegion = new Region({name:req.body["name"],longitude:req.body["lng"], latitude:req.body["lat"]});
					newRegion.save(function (err) {
		  				if (err){
		  					console.log(err);
		  					res.render('servicemessage', {title:defaultDBErrorMessage});
		  				}else{
		  					var message = "New Region added : "+ req.body["name"];
		  					res.render('servicemessage', {title:message});
		  				}
					});
				}
			}
		});
	}else{
		res.render('servicemessage', {title:"Your query seems incomplete."});
	}
}

exports.dialUp = function(req,res){
	res.render('dialup', {title:"Get online"});
}
