import User from './models/user.mjs';
import crypto from 'crypto';

export const authenticate = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) res.status(401).send({ message: 'Invalid email / password' });
    else if (user.password !== req.body.password) res.status(401).send({ message: 'Invalid email / password' });
    else {
        // Token-based secret
        const token = crypto.randomBytes(16).toString('base64');
        user.token = token;
        await user.save();

        req.session.regenerate(function (err) {
            if (err) next(err)

            // Store user's database ID in the session data
            req.session.userId = user._id;
            console.log("Setting session database id =", user._id);

            // Save the session, and return the session-cookie and the token
            req.session.save(function (err) {
                if (err) return next(err)
                res.send({ token });
            })
        })
    }
}

export const authorize = async (req, res, next) => {
    console.log("Session-based auth (userId): ", req.session.userId) ;
		console.log("Token-based auth: ", req.headers['token']) ;
		
    const token = req.headers['token'];

    let ok = true;

    if (!req.session.userId) ok = false;
    if (ok) {
        const user = await User.findOne({ _id: req.session.userId });
        if (!user) ok = false;
    }

    if (!token) ok = false;

    if (ok) {
        const user = await User.findOne({ token });
        if (!user) ok = false;
    }

    if (ok) next();
    else res.status(401).send();
}
