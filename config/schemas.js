var reportSchema = mongoose.Schema({
    status: Number
    , number: String
    , name: String
    , region: mongoose.Schema.Types.ObjectId
    , neighborhood: {type:String, default:""}
    , comments: String
    , date: {type:Date, default: Date.now}
    , connectionType: {type:Number, default:1} 
})

var regionSchema = mongoose.Schema({
	name: String
	,latitude:Number
	,longitude:Number
	,reports:[mongoose.Schema.Types.ObjectId]
})

var feedItemSchema = mongoose.Schema({
	title: String
	,description: String
	,imageURL: String
	,date: Date
});

var report = mongoose.model('Report', reportSchema);
var region = mongoose.model('Region', regionSchema);
var feedItem = mongoose.model('FeedItem', feedItemSchema);