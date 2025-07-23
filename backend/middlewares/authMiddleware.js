import jwt from "jsonwebtoken";

 const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
        console.log('Token not found during authMiddleware');
    return res.status(401).json({ message: "No token, authorization denied" });
    
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ Ensure `req.user.id` is available
    console.log(req.user);
    
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
}

export default authMiddleware