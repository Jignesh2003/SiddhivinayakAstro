// backend/config/passport.js
import crypto from "crypto"; // <-- make sure crypto is imported
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log(profile);

                const email = profile.emails[0].value;
                let user = await User.findOne({ email });
                console.log("User found:", user)
                if (user) {
                    // link googleId if not already
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                } else {
                    const name =
                        profile?.displayName ||
                        [
                            profile.name?.givenName,
                            profile.name?.familyName,
                            profile._json?.given_name,
                            profile._json?.family_name,
                            profile._json?.name
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .trim() ||
                        "Google User";


                    // create new user with agreedToTerms = false
                    console.log("Creating new user with:", {
                        name: name.toLowerCase(),
                        email,
                        googleId: profile.id,
                    });

                    user = await User.create({
                        name: name.toLowerCase(),
                        email,
                        googleId: profile.id,
                        agreedToTerms: false,
                        password: crypto.randomBytes(20).toString("hex"), // random secure password
                    });
                }
                console.log("Authenticated user:", user);
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

export default passport;
