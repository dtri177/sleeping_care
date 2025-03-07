const Favorite = require('../models/Favorite');
const Sound = require('../models/Sound');

exports.getMostListenedSounds = async (req, res) => {
    try {
        // Aggregate favorites by sound, counting occurrences
        const soundStats = await Favorite.aggregate([
            { 
                $group: {
                    _id: { sound: "$sound" },
                    count: { $sum: 1 }
                } 
            },
            { $sort: { count: -1 } } // Sort by count in descending order
        ]);

        // Lookup sound details
        const populatedStats = await Sound.populate(soundStats, {
            path: "_id.sound",
            select: "name duration category",
            model: "Sound"
        });

        // Calculate estimated listening time based on sound duration
        // This assumes sounds have a duration field in seconds
        const processedStats = populatedStats.map(stat => {
            const soundDuration = stat._id.sound.duration || 180; // Default to 3 minutes if no duration
            
            // Convert duration string "MM:SS" to seconds if needed
            let durationInSeconds = soundDuration;
            if (typeof soundDuration === 'string') {
                const parts = soundDuration.split(':');
                durationInSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }
            
            return {
                _id: {
                    name: stat._id.sound.name,
                    category: stat._id.sound.category
                },
                count: stat.count,
                totalListeningTime: stat.count * durationInSeconds,
                averageTimePerSession: durationInSeconds
            };
        });

        // Format the data for charts
        const soundNames = processedStats.map(item => item._id.name);
        const listenCounts = processedStats.map(item => item.count);
        const listenTimes = processedStats.map(item => item.totalListeningTime);

        // Get total favorites count
        const totalFavorites = await Favorite.countDocuments();

        // Get unique users count who have favorites
        const uniqueUsers = await Favorite.distinct("user");
        const uniqueUsersCount = uniqueUsers.length;

        res.render('sound_statistics', {
            soundStats: processedStats,
            soundNames,
            listenCounts,
            listenTimes,
            totalFavorites,
            uniqueUsersCount
        });
    } catch (error) {
        console.error("Error fetching sound statistics:", error);
        res.status(500).render('errors', { message: "An error occurred while fetching sound statistics: " + error.message });
    }
};
exports.addToFavorites = async (req, res) => {
    try {
        const soundId = req.params.id;
        
        // Check if user is authenticated
        // Instead of directly relying on cookies, use the user data from the authentication middleware
        if (!req.user || !req.user.id) {
            return res.redirect('/auth/sign-in');
        }
        
        // Check if sound exists
        const sound = await Sound.findById(soundId);
        if (!sound) {
            return res.status(404).render('errors', { message: "Sound not found" });
        }
        
        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            user: req.user.id,
            sound: soundId
        });
        
        if (existingFavorite) {
            // If already favorited, remove it (toggle functionality)
            await Favorite.findByIdAndDelete(existingFavorite._id);
            return res.redirect('back');  // Redirect back to the previous page
        }
        
        // Create new favorite
        const newFavorite = new Favorite({
            sound: soundId,
            user: req.user.id
        });
        
        await newFavorite.save();
        return res.redirect('back');  // Redirect back to the previous page
        
    } catch (error) {
        console.error("Error adding to favorites:", error);
        return res.status(500).render('errors', { message: "An error occurred while processing your request: " + error.message });
    }
};