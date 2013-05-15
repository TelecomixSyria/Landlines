// Status of a town
// 1 = up, 2 = down, 0=unknown, -1 = mixed reports

// The Compute Status method returns a status and a description string for each town.

exports.cityReport = function (region, allReports){

	var dateFromReport = function(mongoID) {
    	return new Date(parseInt(mongoID.toString().slice(0,8), 16)*1000);
	}

	var oneDayReports = []
	var oneDayInSeconds = 60*60*24;

	for(var i = 0; i < allReports.length; i++){
		if (((new Date () - dateFromReport(allReports[i]._id))/1000) < oneDayInSeconds) {
			oneDayReports.push(allReports[i]);
		};
	}

	if (oneDayReports.length == 0) {
		// We have no recent reports, let's check the 2 older reports and see if they are still matching.
		var oneWeekReports = [];
		var oneWeekInSeconds = 60*60*24*7;

		for (var i = allReports.length - 1; i >= 0; i--) {
			if (((new Date () - dateFromReport(allReports[i]._id))/1000) < oneWeekInSeconds) {
				oneWeekReports.push(allReports[i]);
			};
		}

		if (oneWeekReports.length > 0) {
			// We had at least a single report this week, lets check if they are
			if (oneWeekReports.length == 1) {
				// Easy, single report.
				var status = require("./statusAlgorithm.js").cityStatusFromSingleReport(oneWeekReports[0]);

				if (status == 1){
					// It's up
					return{status:1, description:"Based on one recent report, the current status of landlines of "+region.name+" is up."}

				}else{
					// It's down
					return{status:2, description:"Based on one recent report, the current status of landlines of "+region.name+" is down."}
				}

			}else{
				var status = require("./statusAlgorithm.js").cityStatusFromArrayOfReports(oneWeekReports);

				var description = "Based on "+ oneWeekReports.length + " recent reports, we think that the current status of the landlines of "+ region.name +" is "+ status.description;

				return {status:status, description:description} ;
			}

		}else{
			// We have had no reports this week, let's declare it unknown.
			return {status:0, description:"We have no recent reports for "+ region.name+"."};
		}
	}else{
		if (oneDayReports.length > 0) {
			// We had at least a single report this week, lets check if they are
			if (oneDayReports.length == 1) {
				// Easy, single report.
				var status = require("./statusAlgorithm.js").cityStatusFromSingleReport(oneDayReports[0]);

				if (status == 1){
					return{status:1, description:"Based on one recent report, the current status of landlines of "+region.name+" is up."}

				}else{
					return{status:2, description:"Based on one recent report, the current status of landlines of "+region.name+" is down."}
				}

			}else{
				var status = require("./statusAlgorithm.js").cityStatusFromArrayOfReports(oneDayReports);
				var description = "Based on "+ oneDayReports.length + " recent reports, we think that the current status of the landlines of "+ region.name +" is "+ status.description;
				return {status: status,description: description};
			}

		}else{
			// We have had no reports this week, let's declare it unknown.
			return {status:0, description:"We have no recent reports for "+ region.name+"."};
		}
	}
}

exports.imageForStatus = function(cityReport){
	switch(cityReport.status){
		case -1:
			return "Pins/Mixed-Reports.png"
		case 0:
			return "Pins/Unknown.png";
		case 1:
			return "Pins/PhoneUp.png";
		case 2:
			return "Pins/PhoneDown.png";
		default:
			return "Pins/Mixed-Reports.png";
	}

}

exports.cityStatusFromSingleReport = function(report){
	switch(report.status){
		case 0:
			return 1;
		case 1:
			return 2;
		case 2:
			return 2;
		default:
			return 0;
	}
}


exports.cityStatusFromArrayOfReports = function (reports){
	var numberOfUps = 0;
	var numberOfDowns = 0;
	var statusFromReport = require('./statusAlgorithm.js').cityStatusFromSingleReport;

	for (var i=0; i<reports.length; i++){
		if (reports[i].status != 0){
			numberOfDowns++;
		}else{
			numberOfUps++;
		}
	}

	if (numberOfDowns == 0){
		// It is up
		return {status:1, description:"up."}

	}else if(numberOfUps == 0){
		// It is down
		return {status:2, description:"down."}
	}else{
		// We have mixed reports
		// determine the last one 

		var lastReport = null;
		for (var i=0; i<reports.length; i++){
			if (!lastReport){
				lastReport = reports[i];
			}else if(reports[i].date > lastReport){
				lastReport = reports[i];
			}
		}

		if (statusFromReport(lastReport) == 1){
			return {status:-1, description:"up. Since we are having mixed reports, we advise you to check out the reports to know more."}
		}else{
			return {status:-1, description:"down. Since we are having mixed reports, we advise you to check out the reports to know more."}
		}
	}
}