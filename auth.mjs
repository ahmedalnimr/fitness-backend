// Auth controllers and middleware

import { config } from "dotenv";
import User from './models/user.mjs';
import crypto from 'crypto';
import bcrypt from "bcryptjs";
import ProfileLib from "./libs/profileLib.mjs";
import UserValueHistoryLib from "./libs/userValueHistoryLib.mjs";
import * as v from "./utils/validation.mjs";

// Init dotenv
config();

export const authenticate = async (req, res) => {
	// Validation
	if (!v.isEmail(req.body.email)) return res.status(400).send({message: "Bad request"}) ;
	if (!v.isString(req.body.password, 8)) return res.status(400).send({message: "Bad request"}) ;

	const user = await User.findOne({ email: req.body.email });
	if (!user) res.status(401).send({ message: 'Invalid email / password' });
	else if (!bcrypt.compareSync(req.body.password, user.password)) {
		res.status(401).send({ message: 'Invalid email / password' });
	}
	else {
		// Create database entries for first-login
		await ProfileLib.initialProfileSetup(user._id);
		await UserValueHistoryLib.initialHistorySetup(user._id);

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
	// Validation
	if (!v.isString(req.headers['token'])) return res.status(400).send({message: "Bad request"}) ;

	console.log("Session-based auth (userId): ", req.session.userId);
	console.log("Token-based auth: ", req.headers['token']);

	const token = req.headers['token'];

	// TODO: AUTH BYPASS | TODO: REMOVE IN PRODUCTION!!!!!!!!
	if (process.env.NODE_ENV === 'development') {
		if (token === 'secret_bypass') return next();
	}

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
	else res.status(401).send({ code: 'NOT_AUTHORIZED' });
}

// Logout controller
export const logout = (req, res, next) => {
	// Clear id in session-data and save
	req.session.userId = null;
	req.session.save(function (err) {
		if (err) return next(err);
		// Replace session token
		req.session.regenerate(function (err) {
			if (err) next(err);
			return res.send({ result: true });
		})
	})
};