import Message from "../models/Message.js";

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(100) //loads only last 100 msgs
      .lean(); //tells mongoDb to send Plain Old JavaScript Objects instead of mongoDb documents which are ehavy

    return res.status(200).json({
      success: true,
      data: messages.reverse(),//since the latest messages are in index 0 therefore to make it ususal reading way array is reversed
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
