const User = require('../models/User');
const Sound = require("../models/Sound");

const isUserPremium = async (req) => {
    try {
        const userData = JSON.parse(req.cookies.userData || '{}');
        const user = await User.findById(userData.id);
        return user && user.is_premium;
    } catch (error) {
        return false;
    }
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

const getSoundsByTag = async (req, res, tag, view) => {
    try {
        const isPremium = await isUserPremium(req);
        const query = isPremium ? { tags: tag } : { tags: tag, is_premium: false };
        const sounds = await Sound.find(query);

        const formattedSounds = sounds.map(sound => ({
            ...sound.toObject(),
            duration: formatDuration(sound.duration)
        }));

        res.render(view, { sounds: formattedSounds, error: null });
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách âm thanh (${tag}):`, error);
        res.render(view, { sounds: [], error: "Lỗi khi lấy danh sách âm thanh" });
    }
};

exports.getRainSound = (req, res) => getSoundsByTag(req, res, "rain", "rainSound");
exports.getSoothingSound = (req, res) => getSoundsByTag(req, res, "soothing", "soothingSound");
exports.getOceanSound = (req, res) => getSoundsByTag(req, res, "ocean", "oceanSound");
exports.getPianoSound = (req, res) => getSoundsByTag(req, res, "piano", "pianoSound");

exports.getSounds = async (req, res) => {
    try {
        const isPremium = await isUserPremium(req);
        const query = isPremium ? {} : { is_premium: false };
        const sounds = await Sound.find(query);

        const formattedSounds = sounds.map(sound => ({
            ...sound.toObject(),
            duration: formatDuration(sound.duration)
        }));

        res.render("index", { sounds: formattedSounds });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách âm thanh:", error);
        res.render("index", { sounds: [], error: "Lỗi khi lấy danh sách âm thanh" });
    }
};

exports.getSoundById = async (req, res) => {
    try {
        const sound = await Sound.findById(req.params.id);
        if (!sound) {
            return res.status(404).json({ error: "Không tìm thấy âm thanh" });
        }
        res.json({ audioUrl: sound.preview });
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết âm thanh:", error);
        res.status(500).json({ error: "Lỗi khi phát âm thanh" });
    }
};

exports.updateAllSounds = async (req, res) => {
    try {
        const result = await Sound.updateMany({ images: null }, { $set: { is_premium: true } });
        res.json({ success: true, message: `Cập nhật thành công ${result.modifiedCount} bản ghi!` });
    } catch (error) {
        console.error("Lỗi cập nhật toàn bộ DB:", error);
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật toàn bộ DB!" });
    }
};

exports.deleteShortSounds = async (req, res) => {
    try {
        const result = await Sound.deleteMany({ duration: { $lt: 10 } });
        res.json({ 
            message: `Đã xóa ${result.deletedCount} âm thanh có thời lượng < 10 giây.`,
            success: true 
        });
    } catch (error) {
        console.error("Lỗi khi xóa âm thanh:", error);
        res.status(500).json({ message: "Lỗi khi xóa âm thanh", success: false });
    }
};
