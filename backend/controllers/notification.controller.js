import Notification from "../models/notification.model.js"
export const getNotifications = async (req, res) => {
try {
    const userId = req.user._id;
    const notification = await Notification.find({ to: userId }).populate({
        path : "from",
        select: " username profileImg"
    })
    await Notification.updateMany({ to: userId }, { read: true });
    res.status(200).json(notification);

} catch (error) {
    console.error("Error getting notifications:", error);
    return res(500).json({ message: "Error getting notifications" });   
}
}

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ to: userId });
        res.status(200).json({ message: "Notifications deleted" });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        return res(500).json({ message: "Error deleting notifications" });
        
    }
}