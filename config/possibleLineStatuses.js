
//Names are used in to report

exports.toName = function(number){
	switch(number){
		case 0:
			return "the number was up and I didn't experience any issue"

		case 1:
			return "the number wasn't ringing"

		case 2:
			return "I got a message from the operator telling the number couldn't be reached"

		default:
			return "That possibility couldn't be identified"
	}
}

//Descriptions are used in the feedinformation

exports.toDescription = function(number){
	switch(number){
		case 0:
			return "The phone call was succesful."
		case 1:
			return "The call was unsucessful, the number wasn't ringing."
		case 2:
			return "The caller heard a message from the operator mentioning that the network was experiencing issues."
		default:
			return ""
	}
}

//Generates a custom icon for each possible status

exports.toImage = function(number){
	switch(number){
		case 0:
			return "Pins/PhoneUp.png";
		case 1:
			return "Pins/PhoneDown.png";
		case 2:
			return "Pins/PhoneDown.png";
		default:
			return "Pins/Mixed-Reports.png";
	}
}

exports.possibleOptions = function(){
	toName = require('./possibleLineStatuses.js').toName;

	// We iterate through the numbers until we get to the default case and then we substract that one to get all possible options. 
	// This allows us to be able to add freely new options and keep all the options in the switch

	var possibleStatuses = [];
	var loops = 0;
	while(true){
		status = toName(loops);
		if (loops > 0){
			if (status != possibleStatuses[loops-1]) {
				possibleStatuses.push(status);
				loops++;
			}else{
				possibleStatuses.pop();
				break;
			}
		}else{
			possibleStatuses.push(status);
			loops++;
		}
	}
	
	return possibleStatuses;
}