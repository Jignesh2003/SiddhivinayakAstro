import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // for fast lookup
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    // endTime: Date,
    //   amountCharged: {
    //     type: Number,
    //     default: 0,
    // },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected","ended"],
      default: "pending",
      index: true,
    },
    approvedAt: {
      type: Date, // optional timestamp for when astrologer approved
    },
    nextDebitAt: {
  type: Date
},
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
export default ChatSession;
